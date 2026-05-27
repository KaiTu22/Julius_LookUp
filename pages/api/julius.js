import crypto from "crypto";
import { getCached, invalidateCache } from "@/lib/cache";
import { archiveInfluencer } from "@/lib/db";
import { stripSensitive } from "@/lib/sanitize";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA       = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

export default async function handler(req, res) {
  const apiKey    = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const url      = new URL(req.url, `http://${req.headers.host}`);
  const mode     = url.searchParams.get("mode");
  const platform = url.searchParams.get("platform");
  const handle   = url.searchParams.get("handle");
  const slug     = url.searchParams.get("slug");
  const bypass   = url.searchParams.get("bypass") === "1";

  async function juliusFetch(path) {
    const fullUrl = `${JULIUS_BASE_URL}${path}`;
    const sig = generateSignature("GET", fullUrl, apiSecret);
    return fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   JULIUS_UA,
        "X-API-Key":    apiKey,
        "X-Signature":  sig,
      },
    });
  }

  if (mode === "handle") {
    if (!platform || !handle) {
      return res.status(400).json({ error: "Requires platform and handle." });
    }
    const cleanHandle = handle.replace(/^@/, "");

    // Step 1: resolve handle to slug (cached indefinitely)
    const handleCacheKey = `julius:handle:${platform}:${cleanHandle.toLowerCase()}`;

    let resolvedSlug;
    if (bypass) {
      await invalidateCache(handleCacheKey);
    }

    try {
      resolvedSlug = await getCached(handleCacheKey, async () => {
        const handlePath = `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${Math.floor(Date.now() / 1000)}`;
        const handleRes = await juliusFetch(handlePath);

        if (!handleRes.ok) {
          throw new Error(`Julius API error: ${handleRes.status}`);
        }

        const handleData = await handleRes.json();
        const results = handleData?.results ?? [];
        let match = results.find(r =>
          r.social_combined?.some(s =>
            s.accounts?.some(a => a.remote_handle?.toLowerCase() === cleanHandle.toLowerCase())
          )
        );
        if (!match) match = results[0];

        const slug = match?.slug ?? match?.id;
        if (!slug) {
          throw new Error("Influencer not found for that handle.");
        }
        return slug;
      });
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }

    // Step 2: fetch full export with demographics (cached 24h)
    const exportCacheKey = `julius:export:${resolvedSlug}`;

    if (bypass) {
      await invalidateCache(exportCacheKey);
    }

    try {
      const exportData = await getCached(exportCacheKey, async () => {
        const slugPath = `/influencers/${encodeURIComponent(resolvedSlug)}/export?ts=${Math.floor(Date.now() / 1000)}`;
        const res = await juliusFetch(slugPath);

        if (!res.ok) {
          throw new Error(`Julius API error: ${res.status}`);
        }

        const data = stripSensitive(await res.json());
        await archiveInfluencer(resolvedSlug, data);
        return data;
      }, 86400); // 24h TTL

      res.setHeader("Content-Type", "application/json");
      res.status(200);
      return res.send(JSON.stringify(exportData));
    } catch (err) {
      return res.status(502).json({ error: "Failed to fetch influencer data.", detail: err.message });
    }

  } else if (mode === "slug") {
    if (!slug) {
      return res.status(400).json({ error: "Requires slug." });
    }

    const exportCacheKey = `julius:export:${slug}`;

    if (bypass) {
      await invalidateCache(exportCacheKey);
    }

    try {
      const exportData = await getCached(exportCacheKey, async () => {
        const slugPath = `/influencers/${encodeURIComponent(slug)}/export?ts=${Math.floor(Date.now() / 1000)}`;
        const res = await juliusFetch(slugPath);

        if (!res.ok) {
          throw new Error(`Julius API error: ${res.status}`);
        }

        const data = stripSensitive(await res.json());
        await archiveInfluencer(slug, data);
        return data;
      }, 86400); // 24h TTL

      res.setHeader("Content-Type", "application/json");
      res.status(200);
      return res.send(JSON.stringify(exportData));
    } catch (err) {
      return res.status(502).json({ error: "Failed to fetch influencer data.", detail: err.message });
    }

  } else {
    return res.status(400).json({ error: "Invalid mode." });
  }
}
