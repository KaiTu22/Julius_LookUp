"use client";
import { useEffect, useState } from "react";
import JuliusInfluencerLookup from '../components/JuliusInfluencerLookup';

const ACCENT = "#3b82f6";

const fmt = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/featured-influencers");
        const json = await res.json();
        if (res.ok) setFeatured(json.influencers || []);
      } catch (err) {
        console.error("Failed to fetch featured:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Featured Section */}
      {featured.length > 0 && !loading && (
        <div style={{
          background: "#f9fafb",
          padding: "40px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#111827",
              margin: "0 0 24px 0",
            }}>
              Featured Influencers
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {featured.map(inf => (
                <button
                  key={inf.slug}
                  onClick={() => window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    cursor: "pointer",
                    transition: "all .2s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {inf.avatar?.url ? (
                      <img
                        src={inf.avatar.url}
                        alt={inf.display_name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #e5e7eb",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {inf.display_name}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 2,
                      }}>
                        {inf.tagline || "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 15,
                        fontWeight: 500,
                        color: ACCENT,
                      }}>
                        {fmt(inf.social_total_count)}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6b7280",
                      }}>
                        Followers
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Component */}
      <JuliusInfluencerLookup />
    </div>
  );
}
