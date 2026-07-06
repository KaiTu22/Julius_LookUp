"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const ACCENT = "#3b82f6";

const fontLink = typeof document !== "undefined" && (() => {
  if (!document.getElementById("julius-fonts")) {
    const l = document.createElement("link");
    l.id = "julius-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }
})();

export default function CacheDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cache-stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setStats(json);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: "'Inter',sans-serif", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <div style={{ marginBottom: 12 }}>
          <Link href="/" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Search
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontFamily: "'Instrument Sans',sans-serif", fontWeight: 800, fontSize: 32,
              letterSpacing: -0.5, color: "#111827", margin: 0,
            }}>
              Cache Dashboard
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {lastFetched
                ? `Last refreshed ${lastFetched.toLocaleTimeString()}`
                : "Loading…"}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "10px 18px", borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: loading ? "#f3f4f6" : "#ffffff",
              color: loading ? "#9ca3af" : "#374151",
              fontFamily: "'Instrument Sans',sans-serif", fontWeight: 600, fontSize: 12,
              letterSpacing: 1, textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer", transition: "all .2s",
            }}
          >
            {loading ? "Loading…" : "🔄 Refresh"}
          </button>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: 16, color: "#991b1b", marginBottom: 24,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="Cached Profiles" value={stats?.cachedProfiles} hint="Full influencer data (24h TTL)" />
          <StatCard label="Cached Handles" value={stats?.cachedHandles} hint="Handle → slug lookups" />
          <StatCard label="Total Entries" value={stats ? stats.cachedProfiles + stats.cachedHandles : null} hint="All keys in Redis" />
        </div>

        <div style={{
          background: "#ffffff", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: "20px 24px",
        }}>
          <div style={{
            fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: 3, textTransform: "uppercase",
            color: "#6b7280", marginBottom: 16,
          }}>
            Cached Influencers
          </div>
          {stats?.profileSlugs?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stats.profileSlugs.map(slug => (
                <span key={slug} style={{
                  display: "inline-block", padding: "6px 14px", borderRadius: 20,
                  background: ACCENT + "11", color: ACCENT,
                  fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 500,
                  border: `1px solid ${ACCENT}33`,
                }}>
                  {slug}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: "#9ca3af", fontSize: 14, padding: "12px 0" }}>
              {loading ? "Loading…" : "No profiles cached yet. Search for an influencer to populate the cache."}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 12, padding: "20px 24px",
    }}>
      <div style={{
        fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 11,
        letterSpacing: 3, textTransform: "uppercase",
        color: "#6b7280", marginBottom: 12,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 40, fontWeight: 500,
        color: ACCENT, letterSpacing: -1, lineHeight: 1,
      }}>
        {value ?? "—"}
      </div>
      <div style={{
        fontFamily: "'Inter',sans-serif", fontSize: 12,
        color: "#9ca3af", marginTop: 10,
      }}>
        {hint}
      </div>
    </div>
  );
}
