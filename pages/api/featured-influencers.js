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

  try {
    // Hardcoded list of featured influencers (top creators)
    const featuredSlugs = [
      "cristiano-ronaldo",
      "lionel-messi",
      "selena-gomez",
      "kylie-jenner",
      "dwayne-johnson",
      "ariana-grande",
      "kim-kardashian",
      "taylor-swift",
      "beyonce",
      "justin-bieber",
      "oprah-winfrey",
      "bill-gates"
    ];

    // Fetch enriched data from Julius API
    let bulkData = [];
    if (apiKey && apiSecret) {
      try {
        const ts = Math.floor(Date.now() / 1000);
        const bulkRes = await juliusFetch(
          `/influencers/export/bulk?ts=${ts}`,
          "POST",
          { ids: featuredSlugs },
          apiKey,
          apiSecret
        );

        if (bulkRes.ok) {
          const parsed = await bulkRes.json();
          bulkData = Array.isArray(parsed) ? parsed : parsed.results || [];
          console.log("Featured: got", bulkData.length, "influencers from bulk API");
        } else {
          console.log("Featured: bulk API returned status", bulkRes.status);
        }
      } catch (err) {
        console.warn("Bulk fetch failed:", err.message);
      }
    }

    // Create lookup map
    const bulkMap = {};
    bulkData.forEach(inf => {
      bulkMap[inf.slug] = inf;
    });

    // Map to response format, using bulk data when available
    const influencers = featuredSlugs.map(slug => {
      const bulkInf = bulkMap[slug];
      return {
        id: slug,
        slug: slug,
        display_name: bulkInf?.display_name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        tagline: bulkInf?.tagline || null,
        avatar: bulkInf?.avatar || null,
        social_total_count: bulkInf?.social_total_count || 0,
      };
    });

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
