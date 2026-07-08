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
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  try {
    const ts = Math.floor(Date.now() / 1000);

    // Search Julius API with generic sort to get top influencers
    const payload = {
      query: [],
      sort: ["reach", "desc"],
    };

    console.log("Featured: sending payload:", JSON.stringify(payload));

    const searchRes = await juliusFetch(
      `/influencers/search?ts=${ts}&limit=12&offset=0`,
      "POST",
      payload,
      apiKey,
      apiSecret
    );

    console.log("Featured: response status:", searchRes.status);

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("Julius search failed:", searchRes.status, errText);
      return res.status(200).json({ influencers: [] });
    }

    const searchData = await searchRes.json();
    console.log("Julius search response:", JSON.stringify(searchData).substring(0, 500));
    const results = searchData.results || [];
    console.log("Search results count:", results.length);

    // Get bulk data for enrichment
    const slugs = results.map(r => r.slug).filter(Boolean);
    const ts2 = Math.floor(Date.now() / 1000);

    let bulkData = [];
    if (slugs.length > 0) {
      try {
        const bulkRes = await juliusFetch(
          `/influencers/export/bulk?ts=${ts2}`,
          "POST",
          { ids: slugs },
          apiKey,
          apiSecret
        );

        if (bulkRes.ok) {
          const parsed = await bulkRes.json();
          bulkData = Array.isArray(parsed) ? parsed : parsed.results || [];
        }
      } catch (err) {
        console.warn("Bulk fetch failed:", err.message);
        bulkData = results;
      }
    }

    // Map to response format
    const influencers = bulkData.map(inf => ({
      id: inf.id,
      slug: inf.slug,
      display_name: inf.display_name,
      tagline: inf.tagline,
      avatar: inf.avatar,
      social_total_count: inf.social_total_count,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
