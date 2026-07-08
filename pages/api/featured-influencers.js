export default async function handler(req, res) {
  try {
    // Use our working search endpoint internally to get featured influencers
    // Just do an unfiltered search and return top 12 results
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const searchRes = await fetch(
      `${baseUrl}/api/search-influencers?platform=instagram&limit=12&offset=0`,
      { cache: 'no-store' }
    );

    if (!searchRes.ok) {
      console.error("Search failed for featured:", searchRes.status);
      return res.status(200).json({ influencers: [] });
    }

    const searchData = await searchRes.json();
    const results = searchData.influencers || [];

    // Map to featured format
    const influencers = results.map(inf => ({
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
