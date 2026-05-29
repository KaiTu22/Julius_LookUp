"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString() : "—";

export default function ListDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [list, setList] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setList(json.list);
      setMembers(json.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const remove = async (slug) => {
    try {
      const res = await fetch(`/api/lists/${id}/members/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Remove failed");
      }
      setConfirmRemove(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: "'DM Sans',sans-serif", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/lists" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Lists
          </Link>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: 16, color: "#991b1b", marginBottom: 16,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && !list ? (
          <div style={{ color: "#9ca3af" }}>Loading…</div>
        ) : list ? (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32,
                letterSpacing: -0.5, color: "#111827", margin: 0,
              }}>
                {list.name}
              </h1>
              {list.description && (
                <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                  {list.description}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                {members.length} {members.length === 1 ? "member" : "members"} · Created {fmtDate(list.created_at)}
              </div>
            </div>

            <div style={{
              background: "#ffffff", border: "1px solid #e5e7eb",
              borderRadius: 12, overflow: "hidden",
            }}>
              {members.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>No members yet.</div>
                  <div style={{ fontSize: 12 }}>
                    Search for an influencer and click "Save to List" on their profile to add them here.
                  </div>
                </div>
              ) : (
                members.map((m, idx) => (
                  <div key={m.slug} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px",
                    borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                  }}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.display_name}
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f4f6", flexShrink: 0 }} />
                    )}
                    <Link href={`/?slug=${encodeURIComponent(m.slug)}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, color: "#111827" }}>
                        {m.display_name}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {m.slug}{m.tagline ? ` · ${m.tagline}` : ""}
                      </div>
                    </Link>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#6b7280", flexShrink: 0 }}>
                      {fmtNum(m.total_followers)}
                    </div>
                    {confirmRemove === m.slug ? (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                            background: "#ffffff", color: "#6b7280", cursor: "pointer",
                            fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10,
                            letterSpacing: 1, textTransform: "uppercase",
                          }}
                        >Cancel</button>
                        <button
                          onClick={() => remove(m.slug)}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "none",
                            background: "#ef4444", color: "#ffffff", cursor: "pointer",
                            fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
                            letterSpacing: 1, textTransform: "uppercase",
                          }}
                        >Confirm Remove</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(m.slug)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                          background: "transparent", color: "#9ca3af", cursor: "pointer",
                          fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10,
                          letterSpacing: 1, textTransform: "uppercase",
                          flexShrink: 0,
                        }}
                      >Remove</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}
