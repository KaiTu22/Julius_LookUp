import { sql } from "@/lib/db";

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "empty array";
    const first = value[0];
    const typ = first === null ? "null" : Array.isArray(first) ? "array" : typeof first;
    return `array of ${typ} (${value.length})`;
  }
  if (typeof value === "object") return "object";
  return typeof value;
}

function sampleOf(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.length > 80 ? value.slice(0, 80) + "…" : value;
  if (Array.isArray(value)) {
    return value.slice(0, 3).map(v => typeof v === "object" ? "[object]" : v);
  }
  if (typeof value === "object") return null;
  return value;
}

function walk(obj, path = "", maxDepth = 8, depth = 0, out = []) {
  if (obj === null || obj === undefined || depth > maxDepth) return out;

  if (Array.isArray(obj)) {
    out.push({ path, type: describe(obj), sample: sampleOf(obj) });
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
      walk(obj[0], `${path}[]`, maxDepth, depth + 1, out);
    }
    return out;
  }

  if (typeof obj === "object") {
    if (path) out.push({ path, type: "object" });
    for (const key of Object.keys(obj)) {
      const childPath = path ? `${path}.${key}` : key;
      walk(obj[key], childPath, maxDepth, depth + 1, out);
    }
    return out;
  }

  out.push({ path, type: typeof obj, sample: sampleOf(obj) });
  return out;
}

export default async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug) {
    return res.status(400).json({ error: "Missing required ?slug= query parameter." });
  }
  try {
    const rows = await sql`SELECT raw_data FROM influencers WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ error: `No archived profile for slug "${slug}".` });
    }
    const fields = walk(rows[0].raw_data);
    return res.status(200).json({ slug, fieldCount: fields.length, fields });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
