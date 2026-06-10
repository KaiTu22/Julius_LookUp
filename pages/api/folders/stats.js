import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get stats for each folder
    const stats = await sql`
      SELECT
        f.id,
        f.name,
        f.depth,
        f.parent_id,
        COUNT(DISTINCT l.id) as list_count,
        COUNT(DISTINCT fc.id) as subfolder_count,
        COUNT(DISTINCT lm.influencer_slug) as total_influencers
      FROM folders f
      LEFT JOIN lists l ON l.folder_id = f.id
      LEFT JOIN list_members lm ON l.id = lm.list_id
      LEFT JOIN folders fc ON fc.parent_id = f.id
      GROUP BY f.id, f.name, f.depth, f.parent_id
      ORDER BY f.depth, f.created_at
    `;

    // Get root stats
    const [rootStats] = await sql`
      SELECT
        COUNT(DISTINCT l.id) as ungrouped_lists,
        COUNT(DISTINCT lm.influencer_slug) as ungrouped_influencers
      FROM lists l
      LEFT JOIN list_members lm ON l.id = lm.list_id
      WHERE l.folder_id IS NULL
    `;

    // Get total stats
    const [totalStats] = await sql`
      SELECT
        COUNT(DISTINCT f.id) as total_folders,
        COUNT(DISTINCT l.id) as total_lists,
        COUNT(DISTINCT lm.influencer_slug) as total_influencers
      FROM folders f
      LEFT JOIN lists l ON l.folder_id = f.id
      LEFT JOIN list_members lm ON l.id = lm.list_id
    `;

    return res.status(200).json({
      folders: stats,
      root: rootStats,
      total: totalStats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: err.message });
  }
}
