// Round 2 probe — first round showed that several POST body shapes return 200
// but seem to ignore the filter (always returns top-followers list). Trying
// alternative formats and GET endpoints to find one that actually filters by name.

import crypto from "crypto";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim().replace(/^"|"$/g, "")))
);

const API_KEY    = env.JULIUS_API_KEY;
const API_SECRET = env.JULIUS_API_SECRET;
const BASE_URL   = "https://api.juliusworks.com";
const UA         = "julius-api-client";

function sign(method, fullUrl) {
  return crypto.createHmac("sha256", API_SECRET)
    .update(`${method.toUpperCase()}|${fullUrl}|${UA}`)
    .digest("base64");
}

async function call(method, path, body) {
  const fullUrl = `${BASE_URL}${path}`;
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent":   UA,
      "X-API-Key":    API_KEY,
      "X-Signature":  sign(method, fullUrl),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

const ts = Math.floor(Date.now() / 1000);

const summarize = (body) => {
  if (typeof body === "string") return body.slice(0, 200);
  const total   = body?.total;
  const results = body?.results;
  if (Array.isArray(results)) {
    return {
      total,
      returned: results.length,
      names: results.slice(0, 3).map(r => r.display_name),
    };
  }
  return JSON.stringify(body).slice(0, 200);
};

const probes = [
  // Round 2: more POST body variations
  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST type:keyword",
    body: { query: [{ type: "keyword", values: ["taylor"] }] } },

  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST type:fulltext",
    body: { query: [{ type: "fulltext", values: ["taylor"] }] } },

  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST type:search",
    body: { query: [{ type: "search", values: ["taylor"] }] } },

  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST top-level name",
    body: { name: "taylor" } },

  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST top-level search",
    body: { search: "taylor" } },

  { method: "POST", path: `/influencers/search?ts=${ts}&limit=3&offset=0`,
    label: "POST string query",
    body: { query: "taylor" } },

  // Round 2: alternative GET endpoints
  { method: "GET", path: `/influencers/search?ts=${ts}&q=taylor&limit=3`,
    label: "GET /search?q=" },

  { method: "GET", path: `/influencers/export/name?ts=${ts}&name=taylor`,
    label: "GET /export/name?name=" },

  { method: "GET", path: `/influencers/export?ts=${ts}&name=taylor`,
    label: "GET /export?name=" },
];

console.log(`Probing Julius API for name-search syntax\n`);
for (const p of probes) {
  const r = await call(p.method, p.path, p.body);
  console.log(`▶ ${p.label}`);
  if (p.body) console.log(`   body:    ${JSON.stringify(p.body)}`);
  console.log(`   status:  ${r.status}`);
  console.log(`   result:  ${JSON.stringify(summarize(r.body))}\n`);
}
