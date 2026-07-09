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
  try {
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
  const ethnicities = (url.searchParams.get("ethnicities") || "").split(",").filter(Boolean).map(e => e.trim());
  const ageRangesParam = (url.searchParams.get("ageRanges") || "").split(",").filter(Boolean);
  const platform = url.searchParams.get("platform") || "instagram";
  const followerPlatform = url.searchParams.get("followerPlatform") || "instagram";
  const sort = url.searchParams.get("sort") || "reach-instagram";
  const minFollowers = parseInt(url.searchParams.get("minFollowers") || "0", 10);
  const maxFollowers = url.searchParams.get("maxFollowers") ? parseInt(url.searchParams.get("maxFollowers"), 10) : 0;
  const country = url.searchParams.get("country") || "";
  const minPrice = url.searchParams.get("minPrice") ? parseInt(url.searchParams.get("minPrice"), 10) : 0;
  const maxPrice = url.searchParams.get("maxPrice") ? parseInt(url.searchParams.get("maxPrice"), 10) : 0;
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  // Parse age ranges into min/max pairs
  const parseAgeRange = (range) => {
    if (range === "<16") return { min: null, max: 15 };
    if (range === "18+") return { min: 18, max: null };
    if (range === "60+") return { min: 60, max: null };
    const parts = range.split("-");
    if (parts.length === 2) {
      return { min: parseInt(parts[0], 10), max: parseInt(parts[1], 10) };
    }
    return null;
  };
  const ageRanges = ageRangesParam.map(parseAgeRange).filter(Boolean);

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

  // Add ethnicity filter - optional
  if (ethnicities.length > 0) {
    queryFilters.push({
      type: "race",
      values: ethnicities,
    });
  }

  // Add age range filters (support multiple ranges)
  if (ageRanges.length > 0) {
    if (ageRanges.length === 1) {
      // Single age range
      queryFilters.push({
        type: "age",
        min: ageRanges[0].min,
        max: ageRanges[0].max,
      });
    } else {
      // Multiple age ranges - add each as a separate filter
      ageRanges.forEach(range => {
        queryFilters.push({
          type: "age",
          min: range.min,
          max: range.max,
        });
      });
    }
  }

  // Add location/country filter
  // TODO: Verify Julius API supports location filter - temporarily disabled
  // if (country) {
  //   queryFilters.push({
  //     type: "location",
  //     country,
  //   });
  // }

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

  // Add reach filter for the selected follower platform
  if (minFollowers > 0 || maxFollowers > 0) {
    queryFilters.push({
      type: "reach",
      platform: followerPlatform,
      value: {
        ...(minFollowers > 0 && { min: minFollowers }),
        ...(maxFollowers > 0 && { max: maxFollowers }),
      },
    });
  }

  const ts = Math.floor(Date.now() / 1000);

  // Search local archive first (with pagination)
  // TODO: Archive queries temporarily disabled due to dynamic WHERE clause issues
  // Will re-enable with proper parameterized queries
  let archiveResults = [];
  let archiveTotal = 0;

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
  console.log("About to call Julius API with payload:", payload);

  let searchRes;
  try {
    console.log("Calling Julius API...");
    searchRes = await juliusFetch(
      `/influencers/search?ts=${ts}&limit=${limit}&offset=${offset}`,
      "POST",
      payload,
      apiKey,
      apiSecret
    );
  } catch (err) {
    console.error("Julius API fetch error:", err);
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
      interests,
      platform,
      country,
      ethnicities,
      ageRanges: ageRangesParam,
      payload: JSON.stringify(payload),
    });
    return res.status(searchRes.status).json({
      error: `Julius search failed (HTTP ${searchRes.status})`,
      detail: text,
    });
  }

  console.log("Julius API returned OK response");
  const searchData = await searchRes.json();
  console.log("Julius response parsed:", searchData);
  let results = searchData.results || [];
  const total = searchData.total || 0;
  console.log("Results count:", results.length, "Total:", total);

  // Combine archive and Julius results, removing duplicates
  console.log("Before combining - Archive results:", archiveResults.length, "API results:", results.length);
  const archivedSlugs = new Set(archiveResults.map(r => r.slug));
  const apiOnlyResults = results.filter(r => !archivedSlugs.has(r.slug));
  let combinedResults = [...archiveResults, ...apiOnlyResults];
  console.log("After combining - Combined results:", combinedResults.length);

  // Apply client-side filtering for "all" platform mode to ALL results (archive + API)
  if (platform === "all") {
    if (minFollowers > 0 || maxFollowers > 0) {
      console.log("Filtering by followers - min:", minFollowers, "max:", maxFollowers);
      const beforeFilter = combinedResults.length;
      combinedResults = combinedResults.filter(r => {
        const count = r.social_total_count || 0;
        if (minFollowers > 0 && count < minFollowers) return false;
        if (maxFollowers > 0 && count > maxFollowers) return false;
        return true;
      });
      console.log("After follower filter:", beforeFilter, "->", combinedResults.length);
    }
  }

  // Calculate proper total depending on whether we filtered
  let responseTotal;
  if (platform === "all" && (minFollowers > 0 || maxFollowers > 0)) {
    // For filtered queries, use count of filtered results
    responseTotal = combinedResults.length;
  } else {
    // For unfiltered queries, use actual totals from archive and API
    responseTotal = archiveTotal + total;
  }
  console.log("Combined results before pagination:", combinedResults.length, "| Archive:", archiveResults.length, "| API:", results.length, "| Response total:", responseTotal);

  // Apply pagination after filtering
  combinedResults = combinedResults.slice(0, limit);

  // hasMore is true if we got a full page of results (meaning there could be more)
  const hasMore = combinedResults.length === limit;

  // Bulk lookup for enriched data
  if (combinedResults.length === 0) {
    return res.status(200).json({
      total: responseTotal,
      offset,
      limit,
      filters: { brands, interests, causes, genders, platform, minFollowers, maxFollowers, ageRanges: ageRangesParam, country, minPrice, maxPrice },
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
      filters: { brands, interests, causes, genders, platform, minFollowers, maxFollowers, ageRanges: ageRangesParam, country, minPrice, maxPrice },
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
      total: responseTotal,
      offset,
      limit,
      filters: { brands, interests, causes, genders, platform, minFollowers, maxFollowers, ageRanges: ageRangesParam, country, minPrice, maxPrice },
      influencers: enriched,
      hasMore,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err.message,
    });
  }
}
