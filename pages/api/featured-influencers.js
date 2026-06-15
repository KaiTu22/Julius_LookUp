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
      // Use display_name as Instagram handle (it appears to be the Instagram handle)
      // Use slug as fallback for other platforms
      const handles = {
        instagram_handle: r.display_name,
        tiktok_handle: r.display_name,
        twitter_handle: r.display_name,
        youtube_handle: r.display_name,
      };

      return {
        id: r.slug,
        slug: r.slug,
        display_name: r.display_name,
        tagline: r.tagline,
        avatar: r.avatar_url ? { url: r.avatar_url } : null,
        social_total_count: r.total_followers,
        current_location: null,
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
