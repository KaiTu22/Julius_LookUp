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

function toBrandSlug(name) {
  const slug = name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `brand.${slug}`;
}

export default async function handler(req, res) {
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const brands = (url.searchParams.get("brands") || "").split(",").filter(Boolean);
  const platform = url.searchParams.get("platform") || "instagram";
  const minFollowers = parseInt(url.searchParams.get("minFollowers") || "0", 10);
  const minAge = url.searchParams.get("minAge") ? parseInt(url.searchParams.get("minAge"), 10) : null;
  const maxAge = url.searchParams.get("maxAge") ? parseInt(url.searchParams.get("maxAge"), 10) : null;
  const country = url.searchParams.get("country") || "";
  const minEngagement = url.searchParams.get("minEngagement") ? parseFloat(url.searchParams.get("minEngagement")) : 0;
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  // Build query filters for Julius API
  const queryFilters = [];

  // Add brand filters (tag-based) - optional
  if (brands.length > 0) {
    const brandTags = brands.map(toBrandSlug);
    if (brands.length === 1) {
      queryFilters.push({ type: "tag", specificity: "any", values: brandTags });
    } else {
      queryFilters.push(...brandTags.map(tag => ({ type: "tag", specificity: "any", values: [tag] })));
    }
  }

  // Add age range filter
  if (minAge !== null || maxAge !== null) {
    queryFilters.push({
      type: "age",
      min: minAge,
      max: maxAge,
    });
  }

  // Add location/country filter
  if (country) {
    queryFilters.push({
      type: "location",
      country,
    });
  }

  // Add engagement rate filter (per platform)
  if (minEngagement > 0) {
    queryFilters.push({
      type: "engagement_rate",
      platform: platform,
      value: {
        min: minEngagement / 100, // Convert percentage to decimal
      },
    });
  }

  // Add reach filter (followers on selected platform)
  if (minFollowers > 0) {
    queryFilters.push({
      type: "reach",
      platform: platform,
      value: {
        min: minFollowers,
      },
    });
  }

  const ts = Math.floor(Date.now() / 1000);

  const payload = {
    query: queryFilters,
    sort: ["reach-instagram", "desc"],
  };

  console.log("Discovery search payload:", JSON.stringify(payload, null, 2));

  let searchRes;
  try {
    searchRes = await juliusFetch(
      `/influencers/search?ts=${ts}&limit=${limit}&offset=${offset}`,
      "POST",
      payload,
      apiKey,
      apiSecret
    );
  } catch (err) {
    return res.status(502).json({
      error: "Failed to reach Julius API.",
      detail: err.message,
    });
  }

  if (!searchRes.ok) {
    const text = await searchRes.text();
    console.error("Julius search failed:", {
      status: searchRes.status,
      detail: text,
      brands,
    });
    return res.status(searchRes.status).json({
      error: `Julius search failed (HTTP ${searchRes.status})`,
      detail: text,
    });
  }

  const searchData = await searchRes.json();
  const results = searchData.results || [];
  const total = searchData.total || 0;
  const hasMore = offset + results.length < total;

  // Bulk lookup for enriched data
  if (results.length === 0) {
    return res.status(200).json({
      total,
      offset,
      limit,
      filters: { brands, platform, minFollowers, minAge, maxAge, country, minEngagement },
      influencers: [],
      hasMore: false,
    });
  }

  const slugs = results.map(r => r.slug).filter(Boolean);
  const ts2 = Math.floor(Date.now() / 1000);

  let bulkRes;
  try {
    bulkRes = await juliusFetch(
      `/influencers/export/bulk?ts=${ts2}`,
      "POST",
      { ids: slugs },
      apiKey,
      apiSecret
    );
  } catch (err) {
    // If bulk fails, use search results as-is
    return res.status(200).json({
      total,
      offset,
      limit,
      filters: { brands, platform, minFollowers, minAge, maxAge, country, minEngagement },
      influencers: results.map(inf => ({
        id: inf.id,
        slug: inf.slug,
        display_name: inf.display_name,
        tagline: inf.tagline,
        avatar: inf.avatar,
        gender: inf.gender,
        current_location: inf.current_location,
        social_total_count: inf.social_total_count,
        social_total_engagement: inf.social_total_engagement,
      })),
      hasMore,
    });
  }

  let bulkData = [];
  if (bulkRes.ok) {
    const parsed = await bulkRes.json();
    bulkData = Array.isArray(parsed) ? parsed : parsed.results || [];
  } else {
    bulkData = results;
  }

  const enriched = bulkData.map(inf => ({
    id: inf.id,
    slug: inf.slug,
    display_name: inf.display_name,
    tagline: inf.tagline,
    avatar: inf.avatar,
    gender: inf.gender,
    current_location: inf.current_location,
    social_total_count: inf.social_total_count,
    social_total_engagement: inf.social_total_engagement,
  }));

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    total,
    offset,
    limit,
    filters: { brands, platform, minFollowers, minAge, maxAge, country, minEngagement },
    influencers: enriched,
    hasMore,
  });
}
