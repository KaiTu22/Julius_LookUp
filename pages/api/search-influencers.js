import crypto from "crypto";
import { sql } from "@/lib/db";

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
  const interests = (url.searchParams.get("interests") || "").split(",").filter(Boolean).map(i => i.trim());
  const causes = (url.searchParams.get("causes") || "").split(",").filter(Boolean).map(c => c.trim());
  const genders = (url.searchParams.get("genders") || "").split(",").filter(Boolean).map(g => g.trim());
  const platform = url.searchParams.get("platform") || "instagram";
  const sort = url.searchParams.get("sort") || "reach-instagram";
  const minFollowers = parseInt(url.searchParams.get("minFollowers") || "0", 10);
  const minAge = url.searchParams.get("minAge") ? parseInt(url.searchParams.get("minAge"), 10) : null;
  const maxAge = url.searchParams.get("maxAge") ? parseInt(url.searchParams.get("maxAge"), 10) : null;
  const country = url.searchParams.get("country") || "";
  const minPrice = url.searchParams.get("minPrice") ? parseInt(url.searchParams.get("minPrice"), 10) : 0;
  const maxPrice = url.searchParams.get("maxPrice") ? parseInt(url.searchParams.get("maxPrice"), 10) : 0;
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

  // Add interest filters - optional
  if (interests.length > 0) {
    const interestTags = interests.map(i => `interest.${i.toLowerCase().replace(/\s+/g, "-")}`);
    if (interests.length === 1) {
      queryFilters.push({ type: "tag", specificity: "any", values: interestTags });
    } else {
      queryFilters.push(...interestTags.map(tag => ({ type: "tag", specificity: "any", values: [tag] })));
    }
  }

  // Add cause filters - optional
  if (causes.length > 0) {
    const causeTags = causes.map(c => `cause.${c.toLowerCase().replace(/\s+/g, "-")}`);
    if (causes.length === 1) {
      queryFilters.push({ type: "tag", specificity: "any", values: causeTags });
    } else {
      queryFilters.push(...causeTags.map(tag => ({ type: "tag", specificity: "any", values: [tag] })));
    }
  }

  // Add gender filter - optional
  if (genders.length > 0) {
    queryFilters.push({
      type: "gender",
      values: genders,
    });
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

  // Add price filter (for Instagram post pricing)
  if (minPrice > 0 || maxPrice > 0) {
    queryFilters.push({
      type: "price",
      value: {
        slug: "instagram-post",
        min: minPrice || undefined,
        max: maxPrice || undefined,
      },
    });
  }

  // Add reach filter (only for specific platforms)
  if (minFollowers > 0 && platform !== "all") {
    queryFilters.push({
      type: "reach",
      platform: platform,
      value: {
        min: minFollowers,
      },
    });
  }

  const ts = Math.floor(Date.now() / 1000);

  // Search local archive first
  let archiveResults = [];
  if (sql) {
    try {
      let archiveQuery = `SELECT slug, display_name, tagline, avatar_url, total_followers, raw_data FROM influencers WHERE 1=1`;

      if (minFollowers > 0) {
        archiveQuery += ` AND total_followers >= ${minFollowers}`;
      }

      archiveQuery += ` ORDER BY total_followers DESC LIMIT 50`;

      const rows = await sql(archiveQuery);
      archiveResults = rows.map(r => ({
        id: r.slug,
        slug: r.slug,
        display_name: r.display_name,
        tagline: r.tagline,
        avatar: r.avatar_url ? { url: r.avatar_url } : null,
        social_total_count: r.total_followers,
        social_total_engagement: 0,
        _source: "archive",
      }));
    } catch (err) {
      console.warn("Archive search failed:", err.message);
    }
  }

  // When platform is "all", use generic sorts instead of platform-specific ones
  let juliusSort = sort;
  if (platform === "all" && (sort.includes("instagram") || sort.includes("platform"))) {
    juliusSort = "reach"; // Fall back to reach for all-platform searches
  }

  const payload = {
    query: queryFilters,
    sort: [juliusSort, "desc"],
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
  let results = searchData.results || [];
  const total = searchData.total || 0;

  // Apply client-side filtering for "all" platform mode
  if (platform === "all") {
    if (minFollowers > 0) {
      results = results.filter(r => (r.social_total_count || 0) >= minFollowers);
    }
  }

  // Combine archive and Julius results, removing duplicates
  const archivedSlugs = new Set(archiveResults.map(r => r.slug));
  const apiOnlyResults = results.filter(r => !archivedSlugs.has(r.slug));
  const combinedResults = [...archiveResults, ...apiOnlyResults].slice(0, limit);

  const hasMore = archiveResults.length + apiOnlyResults.length > limit;

  // Bulk lookup for enriched data
  if (combinedResults.length === 0) {
    return res.status(200).json({
      total: total + archiveResults.length,
      offset,
      limit,
      filters: { brands, interests, causes, genders, platform, minFollowers, minAge, maxAge, country, minPrice, maxPrice },
      influencers: [],
      hasMore: false,
    });
  }

  // Only fetch bulk data for non-archive results (archive results already have data)
  const apiResults = combinedResults.filter(r => r._source !== "archive");
  const slugs = apiResults.map(r => r.slug).filter(Boolean);
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
      filters: { brands, interests, causes, genders, platform, minFollowers, minAge, maxAge, country, minPrice, maxPrice },
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
    bulkData = apiResults;
  }

  // Map API results to enriched format
  const enrichedApi = bulkData.map(inf => ({
    id: inf.id,
    slug: inf.slug,
    display_name: inf.display_name,
    tagline: inf.tagline,
    avatar: inf.avatar,
    gender: inf.gender,
    current_location: inf.current_location,
    social_total_count: inf.social_total_count,
    social_total_engagement: inf.social_total_engagement,
    _source: "api",
  }));

  // Combine archive and API results in correct order
  const archiveEnriched = combinedResults.filter(r => r._source === "archive");
  const enriched = [...archiveEnriched, ...enrichedApi];

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    total: archiveResults.length + total,
    offset,
    limit,
    filters: { brands, interests, causes, genders, platform, minFollowers, minAge, maxAge, country, minPrice, maxPrice },
    influencers: enriched,
    hasMore,
  });
}
