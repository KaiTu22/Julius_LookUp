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
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState("");
  const [interests, setInterests] = useState("");
  const [causes, setCauses] = useState("");
  const [genders, setGenders] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState("reach-instagram");
  const [minFollowers, setMinFollowers] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [country, setCountry] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const PLATFORMS = [
    { id: "all", label: "All Platforms" },
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "youtube", label: "YouTube" },
  ];

  const GENDERS = [
    { id: "male", label: "Male" },
    { id: "female", label: "Female" },
    { id: "non-binary", label: "Non-binary" },
  ];

  const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
  ];

  const SORTS = [
    { value: "reach-instagram", label: "Followers (High to Low)" },
    { value: "engagement-rate-instagram", label: "Engagement Rate (High to Low)" },
    { value: "engagement-instagram", label: "Engagement Count (High to Low)" },
    { value: "price", label: "Price (Low to High)" },
  ];

  const handleSearch = async () => {
    const params = new URLSearchParams({
      brands,
      interests,
      causes,
      genders: genders.join(","),
      platform,
      sort,
      minFollowers: minFollowers || "0",
      minAge: minAge || "",
      maxAge: maxAge || "",
      country: country || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
    });
    // Navigate to discover page with filters
    window.location.href = `/discover?${params.toString()}`;
  };

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

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: showFilters ? ACCENT + "22" : "transparent",
              color: showFilters ? ACCENT : "#6b7280",
              cursor: "pointer",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 600,
              fontSize: 12,
              transition: "all .2s",
            }}
          >
            {showFilters ? "▼ Hide Filters" : "▶ Show Advanced Filters"}
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Brands
                  </label>
                  <input
                    type="text"
                    value={brands}
                    onChange={e => setBrands(e.target.value)}
                    placeholder="e.g. Nike, Adidas"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Interests
                  </label>
                  <input
                    type="text"
                    value={interests}
                    onChange={e => setInterests(e.target.value)}
                    placeholder="e.g. fashion, fitness"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Causes
                  </label>
                  <input
                    type="text"
                    value={causes}
                    onChange={e => setCauses(e.target.value)}
                    placeholder="e.g. sustainability"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Min Followers
                  </label>
                  <input
                    type="number"
                    value={minFollowers}
                    onChange={e => setMinFollowers(e.target.value)}
                    placeholder="e.g. 10000"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280", display: "block", marginBottom: 8 }}>
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
                  >
                    {SORTS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: ACCENT,
                  color: "#ffffff",
                  cursor: "pointer",
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Search with Filters
              </button>
            </div>
          )}
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
