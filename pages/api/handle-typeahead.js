import crypto from "crypto";
import { sql } from "@/lib/db";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

async function juliusFetch(path, method = "GET", body = null, apiKey, apiSecret) {
  const fullUrl = `${JULIUS_BASE_URL}${path}`;
  const sig = generateSignature(method, fullUrl, apiSecret);
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": JULIUS_UA,
      "X-API-Key": apiKey,
      "X-Signature": sig,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(fullUrl, opts);
}

export default async function handler(req, res) {
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const { handle } = req.query;

  if (!handle || handle.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const cleanHandle = handle.replace(/^@/, "");
    const results = [];
    const seenSlugs = new Set();

    // List of platforms to search
    const platforms = [
      "instagram",
      "tiktok",
      "twitter",
      "youtube",
      "facebook",
      "twitch",
      "snapchat",
      "pinterest",
      "linkedin",
      "threads",
    ];

    // Search each platform for the handle in parallel
    const platformResults = await Promise.all(
      platforms.map(async (platform) => {
        try {
          const ts = Math.floor(Date.now() / 1000);
          const url = `/influencers/export/social?platform=${encodeURIComponent(
            platform
          )}&handle=${encodeURIComponent(cleanHandle)}&ts=${ts}`;

          const handleRes = await juliusFetch(url, "GET", null, apiKey, apiSecret);

          if (!handleRes.ok) {
            return null;
          }

          const responseData = await handleRes.json();
          // Handle both array and direct object responses
          const influencer = Array.isArray(responseData.results)
            ? responseData.results[0]
            : responseData;

          if (!influencer || !influencer.id) {
            return null;
          }

          return { influencer, platform };
        } catch (err) {
          console.error(`[handle-typeahead] Error on ${platform}:`, err.message);
          return null;
        }
      })
    );

    // Process and deduplicate by slug
    for (const result of platformResults) {
      if (!result) continue;

      const { influencer, platform } = result;
      const slug = influencer.slug || influencer.id;

      // Skip duplicates
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      // Get the URL for this specific platform
      let platformUrl = influencer.social_combined
        ?.find((s) => s.platform?.toLowerCase() === platform.toLowerCase())
        ?.accounts?.[0]?.url;

      if (!platformUrl) {
        platformUrl = `https://juliusworks.com/${slug}`;
      }

      // Try to enrich with archive data if available
      let archiveData = null;
      if (sql) {
        try {
          const archiveRows = await sql`
            SELECT total_followers, tagline, (raw_data->'avatar'->>'url') AS avatar_url
            FROM influencers
            WHERE slug = ${slug}
            LIMIT 1
          `;
          archiveData = archiveRows[0];
        } catch (err) {
          console.error(`[handle-typeahead] Archive lookup failed for ${slug}:`, err.message);
        }
      }

      results.push({
        id: influencer.id,
        slug: slug,
        display_name: influencer.display_name,
        avatar: influencer.avatar || (archiveData?.avatar_url ? { url: archiveData.avatar_url } : {}),
        tagline: archiveData?.tagline || influencer.tagline,
        social_total_count: archiveData?.total_followers || influencer.social_total_count,
        platform: platform,
        platformUrl: platformUrl,
        type: "influencer",
      });
    }

    // Sort by followers
    results.sort((a, b) => (b.social_total_count || 0) - (a.social_total_count || 0));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results: results.slice(0, 20) });
  } catch (err) {
    console.error("Handle typeahead error:", err);
    return res.status(200).json({ results: [] });
  }
}
