import crypto from "crypto";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const { slugs } = req.body;

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return res.status(400).json({ error: "Slugs array is required" });
  }

  try {
    const ts = Math.floor(Date.now() / 1000);
    const bulkRes = await juliusFetch(
      `/influencers/export/bulk?ts=${ts}`,
      "POST",
      { ids: slugs },
      apiKey,
      apiSecret
    );

    if (!bulkRes.ok) {
      const text = await bulkRes.text();
      console.error("Julius bulk fetch failed:", { status: bulkRes.status, detail: text });
      return res.status(bulkRes.status).json({
        error: `Julius fetch failed (HTTP ${bulkRes.status})`,
      });
    }

    const bulkData = await bulkRes.json();
    const influencers = Array.isArray(bulkData) ? bulkData : bulkData.results || [];

    const enriched = influencers.map(inf => ({
      id: inf.id,
      slug: inf.slug,
      display_name: inf.display_name,
      tagline: inf.tagline,
      avatar: inf.avatar,
      social_total_count: inf.social_total_count,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers: enriched });
  } catch (err) {
    console.error("Get influencer data error:", err);
    return res.status(500).json({
      error: "Failed to fetch influencer data",
      detail: err.message,
    });
  }
}
