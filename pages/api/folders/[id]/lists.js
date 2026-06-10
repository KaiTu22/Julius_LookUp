import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const { id } = req.query;
  const { recursive } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get folder info
    const [folder] = await sql`
      SELECT * FROM folders WHERE id = ${id}
    `;

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    let lists;

    if (recursive === "true") {
      // Get all lists in this folder and subfolders (recursive)
      lists = await sql`
        WITH RECURSIVE folder_tree AS (
          SELECT id FROM folders WHERE id = ${id}
          UNION ALL
          SELECT f.id FROM folders f
          JOIN folder_tree ft ON f.parent_id = ft.id
        )
        SELECT
          l.id,
          l.name,
          l.description,
          l.folder_id,
          l.created_at,
          l.updated_at,
          COUNT(lm.influencer_slug) as member_count,
          f.name as folder_name
        FROM lists l
        JOIN folder_tree ft ON l.folder_id = ft.id OR (l.folder_id = ${id})
        LEFT JOIN list_members lm ON l.id = lm.list_id
        LEFT JOIN folders f ON l.folder_id = f.id
        GROUP BY l.id, l.name, l.description, l.folder_id, l.created_at, l.updated_at, f.name
        ORDER BY l.created_at DESC
      `;
    } else {
      // Get only direct lists in this folder
      lists = await sql`
        SELECT
          l.id,
          l.name,
          l.description,
          l.folder_id,
          l.created_at,
          l.updated_at,
          COUNT(lm.influencer_slug) as member_count
        FROM lists l
        LEFT JOIN list_members lm ON l.id = lm.list_id
        WHERE l.folder_id = ${id}
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `;
    }

    return res.status(200).json({ folder, lists });
  } catch (err) {
    console.error("Folder lists error:", err);
    res.status(500).json({ error: err.message });
  }
}
