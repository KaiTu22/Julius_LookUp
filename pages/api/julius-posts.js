import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA       = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

async function juliusFetch(path, apiKey, apiSecret) {
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

export default async function handler(req, res) {
  const apiKey    = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const url      = new URL(req.url, `http://${req.headers.host}`);
  const slug     = url.searchParams.get("slug");
  const platform = url.searchParams.get("platform") || "instagram";
  const limit    = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 20);

  if (!slug?.trim()) {
    return res.status(400).json({ error: "Requires slug parameter." });
  }

  const ts   = Math.floor(Date.now() / 1000);
  const path = `/influencers/${encodeURIComponent(slug)}/social/posts?ts=${ts}&platform=${platform}&limit=${limit}&sort_by=posted_at`;

  let postsRes;
  try {
    postsRes = await juliusFetch(path, apiKey, apiSecret);
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  if (!postsRes.ok) {
    const text = await postsRes.text();
    return res.status(postsRes.status).json({
      error: `Posts fetch failed (HTTP ${postsRes.status})`,
      detail: text,
    });
  }

  const data  = await postsRes.json();
  const posts = Array.isArray(data) ? data : (data.results || data.posts || []);

  // Normalize each post to a clean shape
  const normalized = posts.map(p => ({
    id:               p.id,
    url:              p.canonical_url || null,
    posted_at:        p.posted_at || null,
    engagement:       p.engagement || 0,
    likes:            p.metrics?.likes || 0,
    comments:         p.metrics?.comments || 0,
    caption:          p.text_content || null,
    hashtags:         p.hashtags || [],
    handles:          p.handles || [],
    is_ad:            p.is_advertisement === "true" || p.is_advertisement === true,
    thumbnail:        p.media?.pictures?.[0]?.url || null,
    platform,
  }));

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    slug,
    platform,
    total: data.total || normalized.length,
    posts: normalized,
  });
}
