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

  const url = new URL(req.url, `http://${req.headers.host}`);
  const interests = (url.searchParams.get("interests") || "").split(",").filter(Boolean);
  const minFollowers = parseInt(url.searchParams.get("minFollowers") || "0", 10);
  const country = url.searchParams.get("country") || "";
  const ageRange = url.searchParams.get("ageRange") || "";
  const minEngagement = parseFloat(url.searchParams.get("minEngagement") || "0");
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  if (interests.length === 0) {
    return res.status(400).json({ error: "At least one interest is required." });
  }

  // Build query filters for Julius API
  // Convert interest names to tag format (e.g., "Beauty" -> "interest.beauty")
  const interestTags = interests.map(i => {
    const formatted = i.trim().toLowerCase().replace(/\s+/g, "-");
    return `interest.${formatted}`;
  });

  const queryFilters = [
    {
      type: "tag",
      specificity: "any",
      values: interestTags,
    }
  ];

  const ts = Math.floor(Date.now() / 1000);

  let searchRes;
  try {
    searchRes = await juliusFetch(
      `/influencers/search?ts=${ts}&limit=${limit}&offset=${offset}`,
      "POST",
      {
        query: queryFilters,
        sort: ["follower_count", "desc"],
      },
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
    return res.status(searchRes.status).json({
      error: `Julius search failed (HTTP ${searchRes.status})`,
      detail: text,
      query: queryFilters,
    });
  }

  const searchData = await searchRes.json();
  const results = searchData.results || [];
  const total = searchData.total || 0;
  const hasMore = offset + results.length < total;

  // Apply client-side filtering for non-tag fields
  let filtered = results;

  if (minFollowers > 0) {
    filtered = filtered.filter(r => (r.social_total_count || 0) >= minFollowers);
  }

  if (minEngagement > 0) {
    filtered = filtered.filter(r => {
      const engagement = r.social_total_count > 0
        ? (r.social_total_engagement || 0) / r.social_total_count * 100
        : 0;
      return engagement >= minEngagement;
    });
  }

  // Bulk lookup for enriched data
  if (filtered.length === 0) {
    return res.status(200).json({
      total,
      offset,
      limit,
      filters: {
        interests,
        minFollowers,
        country,
        ageRange,
        minEngagement,
      },
      influencers: [],
      hasMore: false,
    });
  }

  const slugs = filtered.map(r => r.slug).filter(Boolean);
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
      filters: {
        interests,
        minFollowers,
        country,
        ageRange,
        minEngagement,
      },
      influencers: filtered.map(inf => ({
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
    bulkData = filtered;
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
    filters: {
      interests,
      minFollowers,
      country,
      ageRange,
      minEngagement,
    },
    influencers: enriched,
    hasMore,
  });
}

