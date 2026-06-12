import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: "Search term must be at least 2 characters" });
  }

  try {
    const searchTerm = `%${q.toLowerCase()}%`;

    // Search folders
    const folders = await sql`
      SELECT f.id, f.name, f.description, f.depth, f.created_at, 'folder' as type
      FROM folders f
      WHERE LOWER(f.name) LIKE ${searchTerm}
      ORDER BY f.name
      LIMIT 20
    `;

    // Search lists
    const lists = await sql`
      SELECT l.id, l.name, l.description, l.folder_id, l.created_at, 'list' as type
      FROM lists l
      WHERE LOWER(l.name) LIKE ${searchTerm}
      ORDER BY l.name
      LIMIT 20
    `;

    return res.status(200).json({
      query: q,
      folders,
      lists,
      total: folders.length + lists.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
}
