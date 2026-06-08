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

  const term = req.query.term || "";

  if (!term.trim()) {
    return res.status(400).json({ error: "Search term is required." });
  }

  try {
    const ts = Math.floor(Date.now() / 1000);
    const typeaheadRes = await juliusFetch(
      `/influencers/search/typeahead?ts=${ts}&term=${encodeURIComponent(term)}`,
      "GET",
      null,
      apiKey,
      apiSecret
    );

    if (!typeaheadRes.ok) {
      const text = await typeaheadRes.text();
      console.error("Julius typeahead failed:", { status: typeaheadRes.status, detail: text });
      return res.status(typeaheadRes.status).json({
        error: `Julius typeahead failed (HTTP ${typeaheadRes.status})`,
        detail: text,
      });
    }

    const data = await typeaheadRes.json();
    let results = Array.isArray(data) ? data : data.results || [];

    // Fetch full data to get follower counts
    if (results.length > 0) {
      try {
        const slugs = results.map(r => r.slug).filter(Boolean);
        const ts2 = Math.floor(Date.now() / 1000);
        const bulkRes = await juliusFetch(
          `/influencers/export/bulk?ts=${ts2}`,
          "POST",
          { ids: slugs },
          apiKey,
          apiSecret
        );

        if (bulkRes.ok) {
          const bulkData = await bulkRes.json();
          const bulkArray = Array.isArray(bulkData) ? bulkData : bulkData.results || [];

          // Enrich results with follower counts
          results = results.map(r => {
            const fullData = bulkArray.find(b => b.slug === r.slug);
            return {
              ...r,
              social_total_count: fullData?.social_total_count || null,
              tagline: fullData?.tagline || r.tagline,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch full data for typeahead:", err.message);
        // Continue with basic results if bulk fetch fails
      }
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Typeahead error:", err);
    return res.status(500).json({
      error: "Failed to search influencers",
      detail: err.message,
    });
  }
}
