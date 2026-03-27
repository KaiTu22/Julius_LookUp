import crypto from "crypto";

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

    // Step 1: resolve handle to slug
    const handlePath = `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${Math.floor(Date.now() / 1000)}`;
    let handleRes;
    try {
      handleRes = await juliusFetch(handlePath);
    } catch (err) {
      return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
    }

    if (!handleRes.ok) {
      res.setHeader("Content-Type", "application/json");
      res.status(handleRes.status);
      return res.send(await handleRes.text());
    }

    const handleData = await handleRes.json();
    const resolvedSlug = handleData?.slug ?? handleData?.id;

    if (!resolvedSlug) {
      return res.status(404).json({ error: "Influencer not found for that handle." });
    }

    // Step 2: fetch full export with demographics
    const slugPath = `/influencers/${encodeURIComponent(resolvedSlug)}/export?ts=${Math.floor(Date.now() / 1000)}`;
    let slugRes;
    try {
      slugRes = await juliusFetch(slugPath);
    } catch (err) {
      return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(slugRes.status);
    return res.send(await slugRes.text());

  } else if (mode === "slug") {
    if (!slug) {
      return res.status(400).json({ error: "Requires slug." });
    }

    const slugPath = `/influencers/${encodeURIComponent(slug)}/export?ts=${Math.floor(Date.now() / 1000)}`;
    let slugRes;
    try {
      slugRes = await juliusFetch(slugPath);
    } catch (err) {
      return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(slugRes.status);
    return res.send(await slugRes.text());

  } else {
    return res.status(400).json({ error: "Invalid mode." });
  }
}
