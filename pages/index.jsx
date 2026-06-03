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
  const [nameSearch, setNameSearch] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);

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

  const handleNameSearch = async (term) => {
    setNameSearch(term);
    if (term.length < 2) {
      setNameSearchResults([]);
      return;
    }
    setNameSearchLoading(true);
    try {
      const res = await fetch(`/api/typeahead?term=${encodeURIComponent(term)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setNameSearchResults(json.results || []);
    } catch (err) {
      setNameSearchResults([]);
    } finally {
      setNameSearchLoading(false);
    }
  };

  const handleNameSearchSelect = async (influencer) => {
    setNameSearch("");
    setNameSearchResults([]);
    // Archive and navigate to profile
    try {
      await fetch(`/api/archive-influencer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: influencer.slug }),
      });
    } catch (err) {
      console.error("Archive failed:", err);
    }
    window.location.href = `/?slug=${encodeURIComponent(influencer.slug)}`;
  };

  return (
    <div>
      {/* Quick Name Search */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            position: "relative",
            marginBottom: 0,
          }}>
            <input
              type="text"
              value={nameSearch}
              onChange={e => handleNameSearch(e.target.value)}
              placeholder="Quick search by name... (e.g., Taylor Swift)"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "2px solid #3b82f6",
                fontSize: 14,
                fontFamily: "'DM Sans',sans-serif",
                boxSizing: "border-box",
              }}
            />
            {nameSearchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                maxHeight: 300,
                overflowY: "auto",
              }}>
                {nameSearchResults.map(influencer => (
                  <button
                    key={influencer.slug}
                    onClick={() => handleNameSearchSelect(influencer)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      transition: "background .2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {influencer.avatar?.url && (
                      <img
                        src={influencer.avatar.url}
                        alt={influencer.display_name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {influencer.display_name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
