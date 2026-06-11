import { sql } from "@/lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT
          l.id, l.name, l.description, l.folder_id, l.created_at, l.updated_at,
          (SELECT COUNT(*)::int FROM list_members WHERE list_id = l.id) AS member_count
        FROM lists l
        WHERE l.deleted_at IS NULL
        ORDER BY l.created_at DESC
      `;
      return res.status(200).json({ lists: rows });
    }

    if (req.method === "POST") {
      const { name, description } = req.body || {};
      if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
      const [row] = await sql`
        INSERT INTO lists (name, description)
        VALUES (${name.trim()}, ${description?.trim() || null})
        RETURNING id, name, description, created_at, updated_at
      `;
      return res.status(201).json({ list: { ...row, member_count: 0 } });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
