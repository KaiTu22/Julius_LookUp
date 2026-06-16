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

    const influencers = rows.map(r => ({
      id: r.slug,
      slug: r.slug,
      display_name: r.display_name,
      tagline: r.tagline,
      avatar: r.avatar_url ? { url: r.avatar_url } : null,
      social_total_count: r.total_followers,
      current_location: null,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
