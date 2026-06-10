import { sql } from "@/lib/db";

async function buildTree(folderId = null) {
  // Get folders at this level
  let folders;

  if (folderId) {
    folders = await sql`
      SELECT
        f.id,
        f.name,
        f.description,
        f.depth,
        f.display_order,
        f.created_at,
        f.updated_at
      FROM folders f
      WHERE f.parent_id = ${folderId}
      ORDER BY f.display_order, f.created_at
    `;
  } else {
    folders = await sql`
      SELECT
        f.id,
        f.name,
        f.description,
        f.depth,
        f.display_order,
        f.created_at,
        f.updated_at
      FROM folders f
      WHERE f.parent_id IS NULL
      ORDER BY f.display_order, f.created_at
    `;
  }

  // For each folder, get lists and build subtree
  const result = [];
  for (const folder of folders) {
    const lists = await sql`
      SELECT id, name, description, created_at
      FROM lists
      WHERE folder_id = ${folder.id}
      ORDER BY created_at DESC
    `;

    const children = await buildTree(folder.id);

    result.push({
      ...folder,
      type: "folder",
      list_count: lists.length,
      lists,
      subfolders: children,
    });
  }

  return result;
}

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tree = await buildTree();

    // Also get root lists (not in any folder)
    const rootLists = await sql`
      SELECT id, name, description, created_at
      FROM lists
      WHERE folder_id IS NULL
      ORDER BY created_at DESC
    `;

    return res.status(200).json({
      folders: tree,
      rootLists,
    });
  } catch (err) {
    console.error("Folder tree error:", err);
    res.status(500).json({ error: err.message });
  }
}
