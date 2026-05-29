"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const ACCENT = "#3b82f6";

const fontLink = typeof document !== "undefined" && (() => {
  if (!document.getElementById("julius-fonts")) {
    const l = document.createElement("link");
    l.id = "julius-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }
})();

const fmtNum = n => {
  if (n == null) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

const fmtDate = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
};

export default function ArchiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/archive-stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
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
      fontFamily: "'DM Sans',sans-serif", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 12 }}>
          <Link href="/" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Search
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32,
              letterSpacing: -0.5, color: "#111827", margin: 0,
            }}>
              Archive
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {lastFetched
                ? `Last refreshed ${lastFetched.toLocaleTimeString()}`
                : "Loading…"}
              <span style={{ marginLeft: 12 }}>·</span>
              <Link href="/cache" style={{ marginLeft: 12, color: ACCENT, textDecoration: "none" }}>
                Cache Dashboard →
              </Link>
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
              fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12,
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
          <StatCard label="Profiles Archived" value={data?.totalProfiles ?? "—"} hint="Total rows in influencers table" />
          <StatCard label="Followers Archived" value={fmtNum(data?.totalFollowersArchived)} hint="Sum of total_followers across all profiles" />
          <StatCard label="Most Recent" value={data?.mostRecentArchive ? new Date(data.mostRecentArchive).toLocaleDateString() : "—"} hint={data?.mostRecentArchive ? new Date(data.mostRecentArchive).toLocaleTimeString() : "No archives yet"} />
        </div>

        <div style={{
          background: "#ffffff", border: "1px solid #e5e7eb",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px",
            fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: 3, textTransform: "uppercase",
            color: "#6b7280",
            borderBottom: "1px solid #e5e7eb",
          }}>
            Archived Profiles
          </div>

          {data?.profiles?.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <Th>Slug</Th>
                    <Th>Display Name</Th>
                    <Th align="right">Followers</Th>
                    <Th>First Archived</Th>
                    <Th>Last Archived</Th>
                    <Th align="right">Inspect</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.profiles.map(p => (
                    <tr key={p.slug} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <Td><span style={{ fontFamily: "'DM Mono',monospace", color: ACCENT, fontSize: 12 }}>{p.slug}</span></Td>
                      <Td>{p.display_name ?? "—"}</Td>
                      <Td align="right"><span style={{ fontFamily: "'DM Mono',monospace" }}>{fmtNum(p.total_followers)}</span></Td>
                      <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{fmtDate(p.first_fetched_at)}</span></Td>
                      <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{fmtDate(p.last_fetched_at)}</span></Td>
                      <Td align="right">
                        <Link
                          href={`/archive/${p.slug}`}
                          style={{
                            display: "inline-block", padding: "4px 12px", borderRadius: 6,
                            background: ACCENT + "11", color: ACCENT, textDecoration: "none",
                            fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 11,
                            letterSpacing: 1, textTransform: "uppercase",
                            border: `1px solid ${ACCENT}33`,
                          }}
                        >
                          Fields
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "32px 24px", color: "#9ca3af", fontSize: 14 }}>
              {loading ? "Loading…" : "No profiles archived yet. Search for an influencer (or click Refresh on a profile) to populate."}
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
        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11,
        letterSpacing: 3, textTransform: "uppercase",
        color: "#6b7280", marginBottom: 12,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 36, fontWeight: 500,
        color: ACCENT, letterSpacing: -1, lineHeight: 1,
      }}>
        {value ?? "—"}
      </div>
      <div style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 12,
        color: "#9ca3af", marginTop: 10,
      }}>
        {hint}
      </div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th style={{
      textAlign: align, padding: "12px 16px",
      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
      letterSpacing: 2, textTransform: "uppercase",
      color: "#6b7280",
    }}>{children}</th>
  );
}

function Td({ children, align = "left" }) {
  return (
    <td style={{ textAlign: align, padding: "12px 16px", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}
