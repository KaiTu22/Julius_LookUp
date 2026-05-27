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

const typeColor = t => {
  if (t?.startsWith("array")) return "#0ea5e9";
  if (t === "object") return "#6366f1";
  if (t === "string") return "#10b981";
  if (t === "number") return "#f59e0b";
  if (t === "boolean") return "#ec4899";
  return "#6b7280";
};

const fmtSample = s => {
  if (s === null || s === undefined) return "—";
  if (Array.isArray(s)) return s.map(v => (typeof v === "string" ? `"${v}"` : String(v))).join(", ");
  if (typeof s === "string") return `"${s}"`;
  return String(s);
};

export default function ProfileFieldsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/profile-fields?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => { if (!ok) throw new Error(j.error); setFields(j); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const grouped = fields?.fields?.reduce((acc, f) => {
    const root = f.path.split(".")[0].split("[")[0];
    if (!acc[root]) acc[root] = [];
    acc[root].push(f);
    return acc;
  }, {});

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: "'DM Sans',sans-serif", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <Link href="/archive" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Archive
          </Link>
          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32,
            letterSpacing: -0.5, color: "#111827", margin: "10px 0 6px",
          }}>
            Field Structure
          </h1>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: "#6b7280" }}>
            {slug}
          </div>
          {fields && (
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              {fields.fieldCount} fields detected
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: 16, color: "#991b1b",
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && <div style={{ color: "#9ca3af" }}>Loading…</div>}

        {grouped && Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{
            background: "#ffffff", border: "1px solid #e5e7eb",
            borderRadius: 12, marginBottom: 16, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 24px",
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11,
              letterSpacing: 3, textTransform: "uppercase",
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{group}</span>
              <span style={{ color: "#9ca3af", letterSpacing: 1 }}>{items.length} fields</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <Th>Path</Th>
                    <Th>Type</Th>
                    <Th>Sample</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <Td>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#374151" }}>
                          {f.path}
                        </span>
                      </Td>
                      <Td>
                        <span style={{
                          fontFamily: "'DM Mono',monospace", fontSize: 11,
                          padding: "2px 8px", borderRadius: 4,
                          background: typeColor(f.type) + "15",
                          color: typeColor(f.type),
                        }}>
                          {f.type}
                        </span>
                      </Td>
                      <Td>
                        <span style={{
                          fontFamily: "'DM Mono',monospace", fontSize: 11,
                          color: "#6b7280", wordBreak: "break-word",
                        }}>
                          {fmtSample(f.sample)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: "left", padding: "10px 16px",
      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
      letterSpacing: 2, textTransform: "uppercase",
      color: "#9ca3af",
    }}>{children}</th>
  );
}

function Td({ children }) {
  return (
    <td style={{ padding: "10px 16px", verticalAlign: "top" }}>{children}</td>
  );
}
