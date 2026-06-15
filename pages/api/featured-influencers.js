import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(200).json({ influencers: [] });
  }

  try {
    // Get 10 random influencers from archive, ordered by followers
    const rows = await sql`
      SELECT
        slug,
        display_name,
        tagline,
        avatar_url,
        total_followers,
        raw_data
      FROM influencers
      WHERE total_followers > 0
      ORDER BY RANDOM()
      LIMIT 10
    `;

    const influencers = rows.map(r => {
      const handles = {};
      if (r.raw_data) {
        try {
          const data = typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data;
          // Try different possible data structures
          handles.instagram_handle = data.instagram?.['@'] || data.instagram?.handle || data.instagram_handle || (data.social_accounts?.instagram?.handle);
          handles.tiktok_handle = data.tiktok?.['@'] || data.tiktok?.handle || data.tiktok_handle || (data.social_accounts?.tiktok?.handle);
          handles.twitter_handle = data.twitter?.['@'] || data.twitter?.handle || data.twitter_handle || (data.social_accounts?.twitter?.handle);
          handles.youtube_handle = data.youtube?.['@'] || data.youtube?.handle || data.youtube_handle || (data.social_accounts?.youtube?.handle);
        } catch (e) {
          console.error("Failed to parse raw_data for " + r.slug, e);
        }
      }

      return {
        id: r.slug,
        slug: r.slug,
        display_name: r.display_name,
        tagline: r.tagline,
        avatar: r.avatar_url ? { url: r.avatar_url } : null,
        social_total_count: r.total_followers,
        current_location: null,
        raw_data: r.raw_data,
        ...handles,
      };
    });

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
