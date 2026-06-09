import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const { id } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { folder_id } = req.body;

  try {
    // Check list exists
    const [list] = await sql`
      SELECT * FROM lists WHERE id = ${id}
    `;

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    // If folder_id is provided, validate it exists
    if (folder_id) {
      const [folder] = await sql`
        SELECT * FROM folders WHERE id = ${folder_id}
      `;

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
    }

    // Move list to folder
    const [updated] = await sql`
      UPDATE lists
      SET folder_id = ${folder_id || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return res.status(200).json({ list: updated });
  } catch (err) {
    console.error("List move error:", err);
    res.status(500).json({ error: err.message });
  }
}
