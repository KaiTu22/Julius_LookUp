/**
 * pages/api/julius.js
 * ─────────────────────────────────────────────────────────────
 * Backend proxy for the Julius REST API.
 *
 * Handles HMAC-SHA256 request signing server-side so that the
 * browser never needs to touch restricted headers like User-Agent.
 *
 * SETUP
 * ─────
 * 1. Create .env.local in your Next.js project root:
 *
 *      JULIUS_API_KEY=your_api_key_here
 *      JULIUS_API_SECRET=your_signing_secret_here
 *
 * 2. Drop this file at:  pages/api/julius.js
 *
 * 3. The React component calls this proxy at /api/julius —
 *    no credentials or signing logic needed in the frontend.
 *
 * ENDPOINTS SUPPORTED
 * ───────────────────
 * Lookup by social handle (used by the "@ Handle" search mode):
 *   GET /api/julius?mode=handle&platform=instagram&handle=taylorswift
 *   → proxies to: GET /influencers/export?platform=instagram&handle=taylorswift
 *
 * Lookup by Julius slug (used by the "Slug / ID" search mode):
 *   GET /api/julius?mode=slug&slug=taylor-swift
 *   → proxies to: GET /influencers/taylor-swift/export
 */

import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA       = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
}

export default async function handler(req, res) {
  // Only allow GET requests to this proxy
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  // ── Credentials ──────────────────────────────────────────────
  const apiKey    = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({
      error: "Julius credentials not configured. Add JULIUS_API_KEY and JULIUS_API_SECRET to .env.local.",
    });
  }

  // ── Build the Julius URL based on search mode ─────────────────
  const { mode, platform, handle, slug } = req.query;
  const ts = Math.floor(Date.now() / 1000);

  let juliusPath;

  if (mode === "handle") {
    // Lookup by social handle: GET /influencers/export?platform=...&handle=...
    if (!platform || !handle) {
      return res.status(400).json({ error: "Handle lookups require both platform and handle parameters." });
    }
    // Strip @ if the user included it
    const cleanHandle = handle.replace(/^@/, "");
    juliusPath = `/influencers/export?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${ts}`;

  } else if (mode === "slug") {
    // Lookup by Julius slug or ID: GET /influencers/:slug/export
    if (!slug) {
      return res.status(400).json({ error: "Slug lookups require a slug parameter." });
    }
    juliusPath = `/influencers/${encodeURIComponent(slug)}/export?ts=${ts}`;

  } else {
    return res.status(400).json({ error: "Invalid mode. Use 'handle' or 'slug'." });
  }

  const fullUrl   = `${JULIUS_BASE_URL}${juliusPath}`;
  const signature = generateSignature("GET", fullUrl, apiSecret);

  // ── Forward request to Julius ─────────────────────────────────
  let juliusRes;
  try {
    juliusRes = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   JULIUS_UA,   // ✓ settable server-side
        "X-API-Key":    apiKey,
        "X-Signature":  signature,
      },
    });
  } catch (err) {
    console.error("[julius-proxy] Network error:", err);
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  // ── Relay response back to the browser ───────────────────────
  res.setHeader("Content-Type", "application/json");
  res.status(juliusRes.status);
  const body = await juliusRes.text();
  res.send(body);
}
