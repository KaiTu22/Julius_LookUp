import { kv } from "@vercel/kv";

export async function getCached(key, fetcher, ttlSeconds = null) {
  try {
    const cached = await kv.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn(`Cache read failed for ${key}:`, err.message);
  }

  const data = await fetcher();

  try {
    if (ttlSeconds) {
      await kv.setex(key, ttlSeconds, JSON.stringify(data));
    } else {
      await kv.set(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Cache write failed for ${key}:`, err.message);
  }

  return data;
}

export async function invalidateCache(key) {
  try {
    await kv.del(key);
  } catch (err) {
    console.warn(`Cache invalidation failed for ${key}:`, err.message);
  }
}
