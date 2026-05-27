import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const exportKeys = await kv.keys("julius:export:*");
    const handleKeys = await kv.keys("julius:handle:*");

    const profileSlugs = exportKeys
      .map(k => k.replace("julius:export:", ""))
      .sort();

    return res.status(200).json({
      cachedProfiles: exportKeys.length,
      cachedHandles: handleKeys.length,
      profileSlugs,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to read cache stats.",
      detail: err.message,
    });
  }
}
