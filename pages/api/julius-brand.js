import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA       = "julius-api-client";

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
      "User-Agent":   JULIUS_UA,
      "X-API-Key":    apiKey,
      "X-Signature":  sig,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(fullUrl, opts);
}

// Convert a human brand name to a Julius tag slug
// "Coca-Cola" → "brand.coca-cola"
// "Victoria's Secret" → "brand.victorias-secret"
function toBrandSlug(name) {
  const slug = name
    .toLowerCase()
    .replace(/['']/g, "")        // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → dash
    .replace(/^-|-$/g, "");       // trim leading/trailing dashes
  return `brand.${slug}`;
}

export default async function handler(req, res) {
  const apiKey    = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const url       = new URL(req.url, `http://${req.headers.host}`);
  const brandName = url.searchParams.get("brand");
  const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit     = Math.min(limitParam, 50); // cap at 50

  if (!brandName?.trim()) {
    return res.status(400).json({ error: "Requires brand parameter." });
  }

  const brandSlug = toBrandSlug(brandName.trim());

  // ── Step 1: Search for influencers with this brand tag ──────────────────────
  const ts1 = Math.floor(Date.now() / 1000);
  let searchRes;
  try {
    searchRes = await juliusFetch(
      `/influencers/search?ts=${ts1}&limit=${limit}`,
      "POST",
      {
        query: [{ type: "tag", specificity: "any", values: [brandSlug] }],
        sort:  ["reach-instagram", "desc"],
      },
      apiKey, apiSecret
    );
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  if (!searchRes.ok) {
    const text = await searchRes.text();
    return res.status(searchRes.status).json({
      error: `Julius search failed (HTTP ${searchRes.status})`,
      brandSlug,
      detail: text
    });
  }

  const searchData = await searchRes.json();
  const results    = searchData.results || [];

  if (results.length === 0) {
    return res.status(200).json({
      brand: brandName,
      brandSlug,
      total: 0,
      results: [],
    });
  }

  // ── Step 2: Bulk lookup to get full brand relationship data ─────────────────
  const slugs = results.map(r => r.slug).filter(Boolean);
  const ts2   = Math.floor(Date.now() / 1000);
  let bulkRes;
  try {
    bulkRes = await juliusFetch(
      `/influencers/export/bulk?ts=${ts2}`,
      "POST",
      { ids: slugs },
      apiKey, apiSecret
    );
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Julius API (bulk).", detail: err.message });
  }

  let bulkData = [];
  if (bulkRes.ok) {
    const parsed = await bulkRes.json();
    // Bulk endpoint returns either an array or { results: [] }
    bulkData = Array.isArray(parsed) ? parsed : (parsed.results || []);
  } else {
    // Bulk failed — fall back to search results without relationship data
    bulkData = results.map(r => ({ ...r, brands: null }));
  }

  // ── Step 3: Determine relationship type per influencer ──────────────────────
  const enriched = bulkData.map(inf => {
    let relationship = "associated";
    let relationshipLabel = "Associated";
    let sourceUrl = null;

    const check = (arr, type, label) => {
      if (!arr) return false;
      const match = arr.find(b => b.tag === brandSlug);
      if (match) {
        relationship      = type;
        relationshipLabel = label;
        sourceUrl         = match.source_url || null;
        return true;
      }
      return false;
    };

    check(inf.brands?.current,   "current",   "Active Partnership");
    if (relationship === "associated") check(inf.brands?.mention,   "mention",   "Brand Mention");
    if (relationship === "associated") check(inf.brands?.prior,     "prior",     "Past Partnership");
    if (relationship === "associated") check(inf.brands?.supported, "supported", "Brand Supporter");

    // Find top platform by follower count
    const topPlatform = (inf.social_combined || []).reduce((best, s) => {
      return (!best || s.statistics?.count > best.statistics?.count) ? s : best;
    }, null);

    return {
      id:                 inf.id,
      slug:               inf.slug,
      display_name:       inf.display_name,
      tagline:            inf.tagline,
      avatar:             inf.avatar,
      gender:             inf.gender,
      current_location:   inf.current_location,
      social_total_count: inf.social_total_count,
      topPlatform:        topPlatform?.platform || null,
      topPlatformCount:   topPlatform?.statistics?.count || null,
      relationship,
      relationshipLabel,
      sourceUrl,
    };
  });

  // Sort: current first, then mention, then prior, then rest
  const order = { current:0, mention:1, prior:2, supported:3, associated:4 };
  enriched.sort((a,b) => (order[a.relationship]??5) - (order[b.relationship]??5));

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    brand:     brandName,
    brandSlug,
    total:     searchData.total || results.length,
    results:   enriched,
  });
}
