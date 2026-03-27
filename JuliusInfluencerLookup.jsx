import { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// API — all requests go through the Next.js proxy at /api/julius.
// Credentials and signing are handled server-side; nothing secret
// lives in this file.
// ─────────────────────────────────────────────────────────────

async function fetchByHandle(platform, handle) {
  const params = new URLSearchParams({ mode: "handle", platform, handle });
  const res = await fetch(`/api/julius?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${res.status}).`);
  }
  return res.json();
}

async function fetchBySlug(slug) {
  const params = new URLSearchParams({ mode: "slug", slug });
  const res = await fetch(`/api/julius?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${res.status}).`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Data helpers — map Julius's response shape to what the UI needs
// ─────────────────────────────────────────────────────────────

// Pick the best available platform's stats (prefer the platform searched on)

function getPlatformStats(socialCombined, preferredPlatform) {
  if (!socialCombined?.length) return null;
  const preferred = socialCombined.find(p => p.platform === preferredPlatform);
  const result = preferred ?? socialCombined[0];
  return result;
}

}

// Julius demographics live under demographics.instagram (or .twitter) and demographics.tiktok
// Returns the first available platform's demographic data
function getDemographics(raw, preferredPlatform) {
  if (!raw) return null;
  // Try preferred platform first, then instagram, then twitter, then tiktok
  const order = [preferredPlatform, "instagram", "twitter", "tiktok"].filter(Boolean);
  for (const p of order) {
    if (raw[p]) return { platform: p, data: raw[p] };
  }
  return null;
}

// Normalise gender array: [{percentage, label}] → [{label, value}]
function mapGender(arr) {
  if (!arr?.length) return [];
  return arr.map(g => ({ label: g.label, value: Math.round(g.percentage * 10) / 10 }));
}

// Normalise age array: [{label, percentage}] → [{bracket, value}]  sorted by min age
function mapAge(arr) {
  if (!arr?.length) return [];
  return [...arr]
    .sort((a, b) => (a.min ?? 0) - (b.min ?? 0))
    .map(a => ({ bracket: a.label, value: Math.round(a.percentage * 10) / 10 }));
}

// ─────────────────────────────────────────────────────────────
// Demo data (shown when demo mode is on)
// Mirrors the real Julius response shape exactly.
// ─────────────────────────────────────────────────────────────
const DEMO_RAW = {
  id: 28290,
  slug: "taylor-swift",
  display_name: "Taylor Swift",
  gender: "Female",
  avatar: { url: null },
  current_location: { display_name: "New York, NY" },
  social_total_count: 511170411,
  social_combined: [
    {
      platform: "instagram",
      statistics: { engagement: 4069167, count: 248069302 },
      accounts: [{ remote_handle: "taylorswift", statistics: { engagement_rate: { reach: 0.0164 } } }],
    },
  ],
  demographics: {
    instagram: {
      gender: [
        { label: "Female", percentage: 60.61 },
        { label: "Male",   percentage: 39.39 },
      ],
      age: [
        { min: 18, label: "18 - 24", percentage: 18.5 },
        { min: 25, label: "25 - 29", percentage: 25.32 },
        { min: 30, label: "30 - 34", percentage: 25.74 },
        { min: 35, label: "35 - 44", percentage: 18.9 },
        { min: 45, label: "45+",     percentage: 11.54 },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Colour palette
// ─────────────────────────────────────────────────────────────
const GENDER_COLORS = ["#5DCAA5", "#378ADD", "#D4537E", "#EF9F27"];
const AGE_COLOR     = "#534AB7";

function fmt(n) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return Math.round(n / 1_000) + "K";
  return String(n);
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      background: "var(--color-background-secondary)",
      borderRadius: 8, padding: "10px 16px",
    }}>
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function InfluencerCard({ raw, preferredPlatform }) {
  const platformStats = getPlatformStats(raw.social_combined, preferredPlatform);
  const account       = platformStats?.accounts?.[0];
  const engRate       = account?.statistics?.engagement_rate?.reach;
  const demoResult    = getDemographics(raw.demographics, preferredPlatform);
  const genderData    = mapGender(demoResult?.data?.gender);
  const ageData       = mapAge(demoResult?.data?.age);

  const initials = raw.display_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const handle   = account?.remote_handle ? `@${account.remote_handle}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Profile header */}
      <div style={{
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12, padding: "20px 24px",
      }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
          background: "var(--color-background-info)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 500, color: "var(--color-text-info)",
        }}>
          {raw.avatar?.url
            ? <img src={raw.avatar.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : initials}
        </div>

        {/* Name / handle / location */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{raw.display_name}</span>
            {platformStats && (
              <span style={{ fontSize: 12, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", borderRadius: 6, padding: "2px 8px", textTransform: "capitalize" }}>
                {platformStats.platform}
              </span>
            )}
          </div>
          {handle && (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{handle}</div>
          )}
          {raw.current_location?.display_name && (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 3 }}>{raw.current_location.display_name}</div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatPill label="Followers"  value={fmt(platformStats?.statistics?.count ?? raw.social_total_count)} />
          {engRate != null && (
            <StatPill label="Eng. rate" value={(engRate * 100).toFixed(2) + "%"} />
          )}
        </div>
      </div>

      {/* Demographics */}
      {demoResult ? (
        <>
          {/* Platform label */}
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Audience demographics · <span style={{ textTransform: "capitalize" }}>{demoResult.platform}</span>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Gender donut */}
            {genderData.length > 0 && (
              <div style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12, padding: "20px 24px",
              }}>
                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Audience gender</p>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderData} dataKey="value" nameKey="label"
                           cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
                        {genderData.map((_, i) => (
                          <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  {genderData.map((g, i) => (
                    <span key={g.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-secondary)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: GENDER_COLORS[i % GENDER_COLORS.length], display: "inline-block", flexShrink: 0 }} />
                      {g.label} {g.value}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Age bar chart */}
            {ageData.length > 0 && (
              <div style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12, padding: "20px 24px",
              }}>
                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Audience age</p>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={v => `${v}%`} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="value" fill={AGE_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        </>
      ) : (
        <div style={{
          padding: "20px 24px", borderRadius: 10,
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          fontSize: 13, color: "var(--color-text-secondary)",
        }}>
          Influencer found, but no audience demographics are available for this account. This may depend on your Julius service agreement.
        </div>
      )}

    </div>
  );
}

function NotFoundCard({ query }) {
  return (
    <div style={{
      textAlign: "center", padding: "48px 24px",
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12,
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 6px" }}>No influencer found</p>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
        "{query}" wasn't found in the Julius database. Check the spelling or try a different platform.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function JuliusInfluencerLookup() {
  const [demoMode,   setDemoMode]   = useState(true);
  const [searchType, setSearchType] = useState("handle");  // "handle" | "slug"
  const [platform,   setPlatform]   = useState("instagram");
  const [query,      setQuery]      = useState("");
  const [status,     setStatus]     = useState("idle");    // idle | loading | found | not_found | error
  const [rawResult,  setRawResult]  = useState(null);
  const [usedPlatform, setUsedPlatform] = useState("instagram");
  const [errorMsg,   setErrorMsg]   = useState("");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setStatus("loading");
    setRawResult(null);
    setErrorMsg("");

    // Demo mode — return the built-in sample
    if (demoMode) {
      await new Promise(r => setTimeout(r, 800));
      setRawResult(DEMO_RAW);
      setUsedPlatform("instagram");
      setStatus("found");
      return;
    }

    try {
      let data;
      if (searchType === "handle") {
        data = await fetchByHandle(platform, query.trim());
        setUsedPlatform(platform);
      } else {
        // Slug: convert spaces to hyphens and lowercase, e.g. "Taylor Swift" → "taylor-swift"
        const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
        data = await fetchBySlug(slug);
        setUsedPlatform("instagram");
      }

      if (data) { setRawResult(data); setStatus("found"); }
      else        setStatus("not_found");
    } catch (e) {
      setErrorMsg(e.message || "Something went wrong.");
      setStatus("error");
    }
  }, [query, searchType, platform, demoMode]);

  return (
    <div style={{ fontFamily: "var(--font-sans, sans-serif)", maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, padding: "0 0 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>Julius influencer lookup</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Search the Julius database · audience demographics</p>
        </div>
        {/* Demo mode toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)", userSelect: "none" }}>
          <div onClick={() => { setDemoMode(d => !d); setStatus("idle"); setRawResult(null); }} style={{
            width: 36, height: 20, borderRadius: 10, position: "relative",
            background: demoMode ? "#534AB7" : "var(--color-border-secondary)",
            transition: "background .2s", cursor: "pointer", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 3, left: demoMode ? 18 : 3,
              width: 14, height: 14, borderRadius: "50%", background: "#fff",
              transition: "left .2s", pointerEvents: "none",
            }} />
          </div>
          Demo mode
        </label>
      </div>

      {/* Live mode reminder */}
      {!demoMode && (
        <div style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 10, padding: "12px 16px",
          fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6,
        }}>
          Requests route through <code>/api/julius</code>. Make sure <code>JULIUS_API_KEY</code> and <code>JULIUS_API_SECRET</code> are set in <code>.env.local</code>.
        </div>
      )}

      {/* Search controls */}
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12, padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>

        {/* Search type toggle */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", overflow: "hidden" }}>
            {[
              { key: "handle", label: "@ Handle" },
              { key: "slug",   label: "Slug / ID" },
            ].map(opt => (
              <button key={opt.key} onClick={() => { setSearchType(opt.key); setStatus("idle"); setRawResult(null); }} style={{
                padding: "7px 14px", fontSize: 13, border: "none",
                background: searchType === opt.key ? "var(--color-background-info)" : "transparent",
                color: searchType === opt.key ? "var(--color-text-info)" : "var(--color-text-secondary)",
                cursor: "pointer", transition: "background .15s",
              }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Platform selector — only relevant for handle lookups */}
          {searchType === "handle" && (
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              style={{ fontSize: 13, padding: "7px 12px", borderRadius: 8 }}>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter / X</option>
              <option value="pinterest">Pinterest</option>
              <option value="snapchat">Snapchat</option>
            </select>
          )}
        </div>

        {/* Query input + search button */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder={
              searchType === "handle"
                ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} handle, e.g. taylorswift`
                : "Julius slug or ID, e.g. taylor-swift"
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{ flex: 1, fontSize: 14 }}
          />
          <button onClick={handleSearch} disabled={status === "loading" || !query.trim()}
            style={{
              padding: "0 24px", fontSize: 14, fontWeight: 500,
              background: "#534AB7", color: "#fff", border: "none",
              borderRadius: 8, cursor: "pointer",
              opacity: (status === "loading" || !query.trim()) ? 0.5 : 1,
              transition: "opacity .15s",
            }}>
            {status === "loading" ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Helper text */}
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
          {searchType === "handle"
            ? "Enter the handle without @ — results include demographics if available in Julius."
            : "Enter the Julius slug (e.g. taylor-swift) or numeric ID for a direct lookup."}
        </p>
      </div>

      {/* Results */}
      {status === "found"     && rawResult && <InfluencerCard raw={rawResult} preferredPlatform={usedPlatform} />}
      {status === "not_found"               && <NotFoundCard query={query} />}
      {status === "error"                   && (
        <div style={{
          padding: "14px 18px", borderRadius: 10,
          background: "var(--color-background-danger)",
          border: "0.5px solid var(--color-border-danger)",
          fontSize: 13, color: "var(--color-text-danger)", lineHeight: 1.5,
        }}>
          {errorMsg}
        </div>
      )}

    </div>
  );
}
