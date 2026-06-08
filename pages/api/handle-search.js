import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA = "julius-api-client";

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
      "User-Agent": JULIUS_UA,
      "X-API-Key": apiKey,
      "X-Signature": sig,
    },
  });
}

export default async function handler(req, res) {
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const { handle, platform = "instagram" } = req.query;

  if (!handle || handle.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const cleanHandle = handle.replace(/^@/, "");
    const ts = Math.floor(Date.now() / 1000);

    // Use the social export endpoint to resolve handle
    const handleRes = await juliusFetch(
      `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${ts}`,
      apiKey,
      apiSecret
    );

    if (!handleRes.ok) {
      return res.status(200).json({ results: [] });
    }

    const data = await handleRes.json();

    // Format result for typeahead
    const result = {
      id: data.id,
      slug: data.slug,
      display_name: data.display_name,
      avatar: data.avatar || {},
      tagline: data.tagline,
      type: "influencer",
    };

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results: [result] });
  } catch (err) {
    console.error("Handle search error:", err);
    return res.status(200).json({ results: [] });
  }
}
