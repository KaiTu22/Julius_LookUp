import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const { id } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Restore list (set deleted_at to NULL)
    const [restored] = await sql`
      UPDATE lists
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!restored) {
      return res.status(404).json({ error: "List not found" });
    }

    return res.status(200).json({ list: restored });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: err.message });
  }
}
