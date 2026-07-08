"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import JuliusInfluencerLookup from '../components/JuliusInfluencerLookup';

const ACCENT = "#3b82f6";

const fmt = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

const PLATFORMS = [
  { id: "all", label: "All Platforms" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "Twitter/X" },
];

const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
];

export default function Home() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [featured, setFeatured] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [addingToList, setAddingToList] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);

  // Advanced search state
  const [platform, setPlatform] = useState("all");
  const [interests, setInterests] = useState("");
  const [brands, setBrands] = useState("");
  const [causes, setCauses] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [country, setCountry] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleDiscoverySearch = async (pageOffset = 0) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({
        platform: platform,
        interests: interests,
        brands: brands,
        causes: causes,
        minFollowers: minFollowers || "0",
        maxFollowers: maxFollowers || "",
        country: country || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        sort: "reach-instagram",
        limit: "50",
        offset: String(pageOffset),
      });
      const res = await fetch(`/api/search-influencers?${params}`);
      const json = await res.json();
      if (res.ok) {
        if (pageOffset === 0) {
          setSearchResults(json);
        } else {
          setSearchResults(prev => ({
            ...json,
            influencers: [...(prev?.influencers || []), ...json.influencers],
          }));
        }
      }
    } catch (err) {
      console.error("Discovery search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNameSearchSelect = (influencer) => {
    window.open(`/?slug=${encodeURIComponent(influencer.slug)}`, '_blank');
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      console.log("Starting featured fetch...");
      try {
        const res = await fetch("/api/featured-influencers");
        const json = await res.json();
        console.log("Featured API response:", json);
        console.log("Featured count:", json.influencers?.length || 0);
        if (res.ok) {
          setFeatured(json.influencers || []);
          console.log("Featured set to:", json.influencers || []);
        }
      } catch (err) {
        console.error("Failed to fetch featured:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();

    // Load user's lists
    const fetchLists = async () => {
      try {
        const res = await fetch("/api/lists", { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setUserLists(json.lists || []);
      } catch (err) {
        console.error("Failed to fetch lists:", err);
      }
    };
    fetchLists();

    // Load recently viewed from localStorage
    try {
      const stored = localStorage.getItem("recentlyViewed");
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load recently viewed:", err);
    }
  }, []);

  // Track recently viewed profiles
  useEffect(() => {
    if (slug) {
      const addToRecentlyViewed = async () => {
        try {
          // Fetch influencer data to add to recently viewed
          const res = await fetch(`/api/typeahead?term=${encodeURIComponent(slug)}`);
          const json = await res.json();
          const results = json.results || [];
          let influencer = results.find(r => r.slug === slug);

          if (influencer) {
            // Ensure required fields have defaults
            influencer = {
              ...influencer,
              social_total_count: influencer.social_total_count || 0,
              tagline: influencer.tagline || "",
            };

            const stored = localStorage.getItem("recentlyViewed");
            let recent = stored ? JSON.parse(stored) : [];

            // Add to front, remove duplicates, keep last 10
            recent = recent.filter(r => r.slug !== slug);
            recent.unshift(influencer);
            recent = recent.slice(0, 10);

            localStorage.setItem("recentlyViewed", JSON.stringify(recent));
            setRecentlyViewed(recent);
          }
        } catch (err) {
          console.error("Failed to update recently viewed:", err);
        }
      };
      addToRecentlyViewed();
    }
  }, [slug]);

  const handleNameSearch = async (term) => {
    setNameSearch(term);
    if (term.length < 2) {
      setNameSearchResults([]);
      return;
    }

    setNameSearchLoading(true);
    try {
      const res = await fetch(`/api/typeahead?term=${encodeURIComponent(term)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setNameSearchResults(json.results || []);
    } catch (err) {
      setNameSearchResults([]);
    } finally {
      setNameSearchLoading(false);
    }
  };

  const handleSearchEnter = async (e, term) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (nameSearchResults.length > 0) {
      handleNameSearchSelect(nameSearchResults[0]);
    }
  };


  return (
    <div>
      {/* Global Header */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{
            fontFamily: "'Instrument Sans',sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: "#111827",
            margin: 0,
          }}>
            Julius Influencer Lookup
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Tools Menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "'Instrument Sans',sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#6b7280",
                  transition: "all .2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.color = ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                Tools ▼
              </button>
              {showToolsMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 20,
                  minWidth: 150,
                }}>
                  {[
                    { href: "/discover", label: "Discover" },
                    { href: "/lists", label: "Lists" },
                    { href: "/archive", label: "Archive" },
                    { href: "/cache", label: "Cache" },
                  ].map(tool => (
                    <a
                      key={tool.href}
                      href={tool.href}
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        textDecoration: "none",
                        color: ACCENT,
                        fontSize: 12,
                        fontFamily: "'Instrument Sans',sans-serif",
                        fontWeight: 600,
                        transition: "background .2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {tool.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {slug && (
              <a
                href="/"
                style={{
                  color: ACCENT,
                  textDecoration: "none",
                  fontFamily: "'Instrument Sans',sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ← Back
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar + Main Layout */}
      {!slug && (
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* Left Sidebar - Filters */}
        <div style={{
          width: 280,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "32px 24px",
          overflowY: "auto",
        }}>
          {/* Search by Name */}
          <div style={{ marginBottom: 32 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Search by Name
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={nameSearch}
                onChange={e => handleNameSearch(e.target.value)}
                placeholder="e.g., Taylor Swift"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 12,
                  fontFamily: "'Inter',sans-serif",
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
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 20,
                  maxHeight: 200,
                  overflowY: "auto",
                }}>
                  {nameSearchResults.map(influencer => (
                    <button
                      key={influencer.slug}
                      onClick={() => handleNameSearchSelect(influencer)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 11,
                        fontFamily: "'Inter',sans-serif",
                        color: "#374151",
                        transition: "background .2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ fontWeight: 600 }}>{influencer.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 12,
            }}>
              Platform
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'Inter',sans-serif",
                    fontWeight: 500,
                    border: platform === p.id ? `1px solid ${ACCENT}` : "1px solid #d1d5db",
                    background: platform === p.id ? ACCENT + "11" : "transparent",
                    color: platform === p.id ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                    textAlign: "left",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Interests
            </label>
            <input
              type="text"
              value={interests}
              onChange={e => setInterests(e.target.value)}
              placeholder="fashion, fitness..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Brands */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Brands
            </label>
            <input
              type="text"
              value={brands}
              onChange={e => setBrands(e.target.value)}
              placeholder="Nike, Adidas..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Causes */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Causes
            </label>
            <input
              type="text"
              value={causes}
              onChange={e => setCauses(e.target.value)}
              placeholder="sustainability..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Follower Range */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Follower Range
            </label>
            <input
              type="number"
              value={minFollowers}
              onChange={e => setMinFollowers(e.target.value)}
              placeholder="Min"
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
                marginBottom: 6,
              }}
            />
            <input
              type="number"
              value={maxFollowers}
              onChange={e => setMaxFollowers(e.target.value)}
              placeholder="Max"
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Country */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Country
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value="">Any country</option>
              {COUNTRY_OPTIONS.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Price Range (USD)
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min"
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
                marginBottom: 6,
              }}
            />
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max"
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleDiscoverySearch}
            disabled={searchLoading}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              border: "none",
              background: searchLoading ? "#d1d5db" : ACCENT,
              color: "#ffffff",
              cursor: searchLoading ? "not-allowed" : "pointer",
              transition: "all .2s",
            }}
            onMouseEnter={e => {
              if (!searchLoading) e.currentTarget.style.background = "#2563eb";
            }}
            onMouseLeave={e => {
              if (!searchLoading) e.currentTarget.style.background = ACCENT;
            }}
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Right Main Area - Results */}
        <div style={{ flex: 1, background: "#f9fafb", overflowY: "auto" }}>
          <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
            {searchResults && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{
                  fontFamily: "'Instrument Sans',sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#111827",
                  marginBottom: 24,
                }}>
                  {searchResults.total?.toLocaleString() || "?"} Results Found
                </h2>

                {searchResults.influencers && searchResults.influencers.length > 0 ? (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                  }}>
                    {searchResults.influencers.map(inf => (
                      <div
                        key={inf.slug}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: "18px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
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
                              fontFamily: "'Instrument Sans',sans-serif",
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                              {inf.display_name}
                            </div>
                            {inf.tagline && (
                              <div style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 11,
                                color: "#6b7280",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}>
                                {inf.tagline}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{
                          display: "flex",
                          gap: 12,
                          fontSize: 11,
                          fontFamily: "'Inter',sans-serif",
                          color: "#6b7280",
                        }}>
                          <div>📊 {fmt(inf.social_total_count || 0)}</div>
                          <div>💬 {fmt(inf.social_total_engagement || 0)}</div>
                        </div>

                        <button
                          onClick={() => window.open(`/?slug=${encodeURIComponent(inf.slug)}`, '_blank')}
                          style={{
                            padding: "8px 0",
                            borderRadius: 8,
                            fontSize: 11,
                            fontFamily: "'Instrument Sans',sans-serif",
                            fontWeight: 600,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            border: "none",
                            background: ACCENT,
                            color: "#ffffff",
                            cursor: "pointer",
                            transition: "all .2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                          onMouseLeave={e => e.currentTarget.style.background = ACCENT}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {searchResults?.hasMore && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                      <button
                        onClick={() => {
                          const nextOffset = (searchResults?.offset || 0) + (searchResults?.limit || 50);
                          handleDiscoverySearch(nextOffset);
                        }}
                        disabled={searchLoading}
                        style={{
                          padding: "12px 32px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: "'Instrument Sans',sans-serif",
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          border: "none",
                          background: searchLoading ? "#d1d5db" : ACCENT,
                          color: "#ffffff",
                          cursor: searchLoading ? "not-allowed" : "pointer",
                          transition: "all .2s",
                        }}
                        onMouseEnter={e => {
                          if (!searchLoading) e.currentTarget.style.background = "#2563eb";
                        }}
                        onMouseLeave={e => {
                          if (!searchLoading) e.currentTarget.style.background = ACCENT;
                        }}
                      >
                        {searchLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                ) : (
                  <div style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 32,
                    textAlign: "center",
                    color: "#6b7280",
                  }}>
                    No influencers found. Try adjusting your search criteria.
                  </div>
                )}
              </div>
            )}

            {!searchResults && (
              <div>
                <div style={{
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: "32px 0",
                  fontFamily: "'Inter',sans-serif",
                }}>
                  <p>Use the filters on the left to search for influencers</p>
                </div>

                {/* Featured Section - shown when no search results */}
                {featured.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={{
                      fontFamily: "'Instrument Sans',sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#111827",
                      marginBottom: 24,
                    }}>
                      Featured Influencers
                    </h2>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 16,
                    }}>
                      {featured.map(inf => (
                        <div
                          key={inf.slug}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            cursor: "pointer",
                            transition: "all .2s",
                          }}
                          onClick={() => window.open(`/?slug=${encodeURIComponent(inf.slug)}`, '_blank')}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                            e.currentTarget.style.transform = "translateY(-4px)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {/* Image */}
                          <div style={{
                            aspectRatio: "1 / 1",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}>
                            {inf.avatar?.url ? (
                              <img
                                src={inf.avatar.url}
                                alt={inf.display_name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div style={{
                                width: "100%",
                                height: "100%",
                                background: "#f3f4f6",
                              }} />
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ padding: 12 }}>
                            <div style={{
                              fontFamily: "'Instrument Sans',sans-serif",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#111827",
                              marginBottom: 4,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                              {inf.display_name}
                            </div>
                            <div style={{
                              fontFamily: "'Inter',sans-serif",
                              fontSize: 10,
                              color: "#6b7280",
                              marginBottom: 8,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                              {inf.tagline || "—"}
                            </div>
                            <div style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 11,
                              fontWeight: 500,
                              color: ACCENT,
                            }}>
                              {fmt(inf.social_total_count)} followers
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <div>
                <h2 style={{
                  fontFamily: "'Instrument Sans',sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#111827",
                  marginBottom: 24,
                  marginTop: 48,
                }}>
                  Recently Viewed
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}>
                  {recentlyViewed.map(inf => (
                    <div
                      key={inf.slug}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "16px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                      onClick={() => window.open(`/?slug=${encodeURIComponent(inf.slug)}`, '_blank')}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {inf.avatar?.url ? (
                        <img
                          src={inf.avatar.url}
                          alt={inf.display_name}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            objectFit: "cover",
                            margin: "0 auto 12px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: "#e5e7eb",
                          margin: "0 auto 12px",
                        }} />
                      )}
                      <div style={{
                        fontFamily: "'Instrument Sans',sans-serif",
                        fontWeight: 600,
                        fontSize: 12,
                        color: "#111827",
                        marginBottom: 4,
                      }}>
                        {inf.display_name}
                      </div>
                      <div style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 10,
                        color: "#6b7280",
                      }}>
                        📊 {fmt(inf.social_total_count || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Original Quick Name Search - REMOVED, kept for reference */}
      {false && (
      <div style={{
        background: "#f9fafb",
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
              onKeyDown={e => handleSearchEnter(e, nameSearch)}
              placeholder="e.g., Taylor Swift or @handle"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "2px solid #3b82f6",
                fontSize: 14,
                fontFamily: "'Inter',sans-serif",
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
                maxHeight: 400,
                overflowY: "auto",
              }}>
                {nameSearchResults.map(influencer => (
                  <button
                    key={`${influencer.slug}-${influencer.platform || 'base'}`}
                    onClick={() => handleNameSearchSelect(influencer)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 0,
                      border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
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
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Instrument Sans',sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {influencer.display_name}
                      </div>
                      <div style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 11,
                        color: "#3b82f6",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {influencer.accountUrl || influencer.platformUrl || "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Link to Advanced Search */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a
              href="/discover"
              style={{
                color: ACCENT,
                textDecoration: "none",
                fontFamily: "'Instrument Sans',sans-serif",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              → Advanced Search & Filters
            </a>
          </div>
        </div>
      </div>
      )}

      {/* Old full-width sections removed - all functionality integrated into sidebar layout */}

      {/* Add to List Modal */}
      {addingToList && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }} onClick={() => setAddingToList(null)}>
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#111827",
              marginBottom: 4,
            }}>
              Add {addingToList.display_name} to a List
            </div>
            <div style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 16,
            }}>
              Select a list or create a new one
            </div>

            {userLists.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 300,
                  overflowY: "auto",
                }}>
                  {userLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => {
                        // Add influencer to list
                        fetch(`/api/lists/${list.id}/add-member`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ influencer_slug: addingToList.slug }),
                        }).then(() => {
                          setAddingToList(null);
                          alert(`Added to "${list.name}"`);
                        }).catch(err => {
                          alert(`Error: ${err.message}`);
                        });
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        background: "#f9fafb",
                        color: "#111827",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 500,
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = ACCENT;
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.color = "#111827";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                    >
                      📋 {list.name}
                      {list.member_count > 0 && (
                        <div style={{ fontSize: 11, color: "inherit", marginTop: 2 }}>
                          {list.member_count} member{list.member_count !== 1 ? "s" : ""}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: 16,
                background: "#f9fafb",
                borderRadius: 6,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 13,
                marginBottom: 16,
              }}>
                No lists yet. Create one in the Lists section.
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href="/lists"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  background: ACCENT,
                  color: "#ffffff",
                  textDecoration: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Instrument Sans',sans-serif",
                }}
              >
                Go to Lists
              </a>
              <button
                onClick={() => setAddingToList(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Instrument Sans',sans-serif",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile View - Only show when slug is present */}
      {slug && <JuliusInfluencerLookup />}
    </div>
  );
}
