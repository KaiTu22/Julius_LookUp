import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { list_ids, folder_id } = req.body;

  if (!Array.isArray(list_ids) || list_ids.length === 0) {
    return res.status(400).json({ error: "list_ids must be a non-empty array" });
  }

  try {
    // If folder_id is provided, validate it exists
    if (folder_id) {
      const [folder] = await sql`
        SELECT * FROM folders WHERE id = ${folder_id}
      `;

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
    }

    // Move all lists to folder
    const updated = await sql`
      UPDATE lists
      SET folder_id = ${folder_id || null}, updated_at = NOW()
      WHERE id = ANY(${list_ids})
      RETURNING *
    `;

    return res.status(200).json({
      moved_count: updated.length,
      lists: updated,
    });
  } catch (err) {
    console.error("Batch move error:", err);
    res.status(500).json({ error: err.message });
  }
}
