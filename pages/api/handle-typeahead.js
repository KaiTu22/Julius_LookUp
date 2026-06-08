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

const PLATFORM_URLS = {
  instagram: handle => `https://instagram.com/${handle}`,
  tiktok: handle => `https://tiktok.com/@${handle}`,
  twitter: handle => `https://twitter.com/${handle}`,
  youtube: handle => `https://youtube.com/@${handle}`,
  facebook: handle => `https://facebook.com/${handle}`,
  pinterest: handle => `https://pinterest.com/${handle}`,
  snapchat: handle => `https://snapchat.com/add/${handle}`,
};

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
    const ts = Math.floor(Date.now() / 1000);

    // Try to resolve on multiple platforms
    const platforms = ["instagram", "tiktok", "twitter", "youtube", "facebook"];
    const results = [];

    for (const platform of platforms) {
      try {
        const res = await juliusFetch(
          `/influencers/export/social?platform=${platform}&handle=${encodeURIComponent(cleanHandle)}&ts=${ts}`,
          apiKey,
          apiSecret
        );

        if (res.ok) {
          const data = await res.json();
          if (data.slug) {
            const platformUrl = PLATFORM_URLS[platform]?.(cleanHandle) || `https://${platform}.com/${cleanHandle}`;
            results.push({
              id: data.id,
              slug: data.slug,
              display_name: data.display_name,
              avatar: data.avatar || {},
              tagline: data.tagline,
              platform,
              platformUrl,
              social_total_count: data.social_total_count,
              type: "influencer",
            });
          }
        }
      } catch (err) {
        // Continue to next platform
      }
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Handle typeahead error:", err);
    return res.status(200).json({ results: [] });
  }
}
