import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.query.confirm !== "yes") {
    return res.status(400).json({
      error: "Add ?confirm=yes to the URL to flush. This deletes all cached profile data.",
      hint: "Example: /api/flush-cache?confirm=yes",
    });
  }

  try {
    const keys = await kv.keys("julius:export:*");
    if (keys.length === 0) {
      return res.status(200).json({ deleted: 0, message: "No cached profiles to flush." });
    }
    for (const key of keys) {
      await kv.del(key);
    }
    return res.status(200).json({
      deleted: keys.length,
      keys,
      message: `Flushed ${keys.length} cached profile(s). They'll be re-fetched (sanitized) on next search.`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
