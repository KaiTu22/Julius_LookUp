"use client";
import { useState, useEffect } from "react";

const ACCENT = "#3b82f6";

export default function FolderStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/folders/stats");
        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return null;
  }

  if (!stats) {
    return null;
  }

  return (
    <div style={{
      padding: 12,
      background: "#f9fafb",
      borderRadius: 8,
      marginBottom: 16,
      fontSize: 12,
    }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 600, color: ACCENT }}>
            {stats.total?.total_folders || 0}
          </div>
          <div style={{ color: "#6b7280", marginTop: 2 }}>Folders</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, color: ACCENT }}>
            {stats.total?.total_lists || 0}
          </div>
          <div style={{ color: "#6b7280", marginTop: 2 }}>Lists</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, color: ACCENT }}>
            {stats.total?.total_influencers || 0}
          </div>
          <div style={{ color: "#6b7280", marginTop: 2 }}>Influencers</div>
        </div>

        {stats.root?.ungrouped_lists > 0 && (
          <div>
            <div style={{ fontWeight: 600, color: "#f59e0b" }}>
              {stats.root.ungrouped_lists}
            </div>
            <div style={{ color: "#6b7280", marginTop: 2 }}>Ungrouped</div>
          </div>
        )}
      </div>
    </div>
  );
}
