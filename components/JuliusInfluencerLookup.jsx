"use client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis
} from "recharts";

// --- Google Fonts ------------------------------------------------------------
const fontLink = typeof document !== "undefined" && (() => {
  if (!document.getElementById("julius-fonts")) {
    const l = document.createElement("link");
    l.id = "julius-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }
})();

// --- Demo Data ----------------------------------------------------------------
const DEMO = {
  display_name: "Taylor Swift",
  tagline: "Musician",
  dob: "1989-12-13",
  gender: "Female",
  slug: "taylor-swift",
  avatar: { url: "https://assets.julius.cloud/influencers/2020-06-25-184224-004-esnkzy2v.jpg" },
  current_location: { display_name: "New York, New York" },
  social_total_count: 574880766,
  social_total_engagement: 7126430,
  social_combined: [
    { platform: "instagram", statistics: { count: 280484680, engagement: 3944181, engagement_rate: { reach: 0.01406 } } },
    { platform: "tiktok",    statistics: { count: 33600000,  engagement: 1142250, engagement_rate: { reach: 0.03399 } } },
    { platform: "youtube",   statistics: { count: 88300000,  engagement: 476469,  engagement_rate: { reach: 0.00392 } } },
    { platform: "facebook",  statistics: { count: 78832248,  engagement: 314586,  engagement_rate: { reach: 0.00399 } } },
    { platform: "twitter",   statistics: { count: 93663838,  engagement: 1248944, engagement_rate: { reach: 0.01333 } } },
  ],
  demographics: {
    instagram: {
      age: [
        { label: "< 16",  percentage: 0.7 },
        { label: "17-19", percentage: 2.02 },
        { label: "20-24", percentage: 9.79 },
        { label: "25-29", percentage: 19.87 },
        { label: "30-34", percentage: 26.33 },
        { label: "35-39", percentage: 22.05 },
        { label: "40-49", percentage: 9.8 },
        { label: "50-59", percentage: 3.75 },
        { label: "60+",   percentage: 5.7 },
      ],
      gender: [{ label: "Female", percentage: 61.13 }, { label: "Male", percentage: 38.87 }],
      race: [
        { label: "White",    percentage: 80.17 },
        { label: "Hispanic", percentage: 12.42 },
        { label: "Black",    percentage: 4.7 },
        { label: "Asian",    percentage: 2.72 },
      ],
      income: [
        { label: "$10k-$20k", percentage: 24.3 },
        { label: "$20k-$30k", percentage: 10.96 },
        { label: "$30k-$40k", percentage: 8.25 },
        { label: "$40k-$50k", percentage: 9.39 },
        { label: "$50k-$75k", percentage: 25.62 },
        { label: "$75k-$100k", percentage: 7.98 },
        { label: "$100k+",    percentage: 2.17 },
      ],
      interest: [
        { label: "Pop",                percentage: 44.11 },
        { label: "Dance-Pop",          percentage: 40.86 },
        { label: "Rock",               percentage: 40.4 },
        { label: "Teen Pop",           percentage: 38.2 },
        { label: "Country",            percentage: 38.04 },
        { label: "R&B",                percentage: 32.4 },
        { label: "Club & Dance",       percentage: 31.73 },
        { label: "Alt & Indie Rock",   percentage: 27.14 },
        { label: "Rap & Hip Hop",      percentage: 22.03 },
        { label: "Music",              percentage: 20.47 },
        { label: "Electronic",         percentage: 19.97 },
        { label: "Fashion",            percentage: 18.37 },
        { label: "Dance",              percentage: 18.16 },
        { label: "Drama",              percentage: 16.52 },
        { label: "Underwear",          percentage: 16.14 },
      ],
      brand: [
        { label: "Victoria's Secret", percentage: 28.66 },
        { label: "Nike",              percentage: 26.71 },
        { label: "NASA",              percentage: 20.8 },
        { label: "Disney",            percentage: 20.73 },
        { label: "Starbucks",         percentage: 17.62 },
        { label: "Youtube",           percentage: 17.44 },
        { label: "adidas",            percentage: 16.95 },
        { label: "Marvel",            percentage: 16.01 },
        { label: "H&M",               percentage: 14.99 },
        { label: "Netflix",           percentage: 14.63 },
        { label: "CHANEL",            percentage: 13.01 },
        { label: "Louis Vuitton",     percentage: 11.76 },
        { label: "Sephora",           percentage: 11.62 },
        { label: "Forever 21",        percentage: 11.42 },
        { label: "Gucci",             percentage: 10.82 },
      ],
      "location-by-country": [
        { label: "United States",  percentage: 22.05 },
        { label: "Indonesia",      percentage: 13.03 },
        { label: "Brazil",         percentage: 10.77 },
        { label: "Philippines",    percentage: 6.79 },
        { label: "India",          percentage: 5.74 },
        { label: "Nigeria",        percentage: 2.23 },
        { label: "Mexico",         percentage: 2.2 },
        { label: "United Kingdom", percentage: 2.17 },
        { label: "Malaysia",       percentage: 2.08 },
        { label: "Thailand",       percentage: 2.07 },
      ],
      "location-by-us-state": [
        { label: "California",   percentage: 15.12 },
        { label: "Texas",        percentage: 9.12 },
        { label: "New York",     percentage: 7.02 },
        { label: "Florida",      percentage: 5.2 },
        { label: "Pennsylvania", percentage: 4.56 },
        { label: "Ohio",         percentage: 3.83 },
        { label: "Illinois",     percentage: 3.82 },
        { label: "Georgia",      percentage: 3.4 },
        { label: "Michigan",     percentage: 3.02 },
        { label: "Tennessee",    percentage: 2.77 },
      ],
    },
    tiktok: {
      age: [
        { label: "< 16",  percentage: 5.2 },
        { label: "17-19", percentage: 14.11 },
        { label: "20-24", percentage: 40.47 },
        { label: "25-29", percentage: 22.75 },
        { label: "30-34", percentage: 10.59 },
        { label: "35-39", percentage: 4.33 },
        { label: "40-49", percentage: 2.15 },
        { label: "50-59", percentage: 0.16 },
        { label: "60+",   percentage: 0.24 },
      ],
      gender: [{ label: "Female", percentage: 74.69 }, { label: "Male", percentage: 25.31 }],
      race: [
        { label: "White",    percentage: 86.72 },
        { label: "Hispanic", percentage: 8.14 },
        { label: "Black",    percentage: 4.2 },
        { label: "Asian",    percentage: 0.94 },
      ],
      income: [
        { label: "$10k-$20k",  percentage: 14.32 },
        { label: "$20k-$30k",  percentage: 16.0 },
        { label: "$30k-$40k",  percentage: 11.55 },
        { label: "$40k-$50k",  percentage: 10.43 },
        { label: "$50k-$75k",  percentage: 21.13 },
        { label: "$75k-$100k", percentage: 3.7 },
        { label: "$100k+",     percentage: 1.12 },
      ],
      interest: [
        { label: "Pop",          percentage: 64.48 },
        { label: "Dance",        percentage: 45.4 },
        { label: "Rap & Hip Hop",percentage: 33.18 },
        { label: "Music",        percentage: 26.13 },
        { label: "Comedy",       percentage: 25.96 },
        { label: "Makeup",       percentage: 24.73 },
        { label: "Cooking",      percentage: 23.72 },
        { label: "K-Pop",        percentage: 21.47 },
        { label: "Fashion",      percentage: 19.41 },
        { label: "Travel",       percentage: 19.35 },
        { label: "Latin",        percentage: 19.22 },
        { label: "Electronic",   percentage: 18.62 },
        { label: "Pets",         percentage: 17.88 },
        { label: "Dance-Pop",    percentage: 17.8 },
        { label: "Country",      percentage: 16.61 },
      ],
      brand: [
        { label: "Netflix",           percentage: 48.37 },
        { label: "Disney",            percentage: 26.89 },
        { label: "Marvel",            percentage: 26.29 },
        { label: "Amazon",            percentage: 14.98 },
        { label: "Victoria's Secret", percentage: 14.88 },
        { label: "Gucci",             percentage: 14.23 },
        { label: "Starbucks",         percentage: 14.0 },
        { label: "Kylie Jenner",      percentage: 12.76 },
        { label: "Shein",             percentage: 12.53 },
        { label: "Nike",              percentage: 12.37 },
        { label: "Duolingo",          percentage: 12.35 },
        { label: "Christian Dior",    percentage: 11.66 },
        { label: "Sephora",           percentage: 11.55 },
        { label: "Lionsgate",         percentage: 10.88 },
        { label: "Jiffpom",           percentage: 10.77 },
      ],
      "location-by-country": [
        { label: "United States",  percentage: 45.47 },
        { label: "United Kingdom", percentage: 6.46 },
        { label: "Mexico",         percentage: 6.24 },
        { label: "Philippines",    percentage: 6.15 },
        { label: "Brazil",         percentage: 5.41 },
        { label: "Canada",         percentage: 3.39 },
        { label: "Australia",      percentage: 1.84 },
        { label: "Argentina",      percentage: 1.84 },
        { label: "Indonesia",      percentage: 1.59 },
        { label: "Italy",          percentage: 1.5 },
      ],
      "location-by-us-state": [
        { label: "California",   percentage: 14.36 },
        { label: "Texas",        percentage: 8.86 },
        { label: "Florida",      percentage: 6.04 },
        { label: "New York",     percentage: 6.0 },
        { label: "Pennsylvania", percentage: 4.73 },
        { label: "Ohio",         percentage: 4.27 },
        { label: "Michigan",     percentage: 4.1 },
        { label: "Illinois",     percentage: 3.45 },
        { label: "N. Carolina",  percentage: 3.13 },
        { label: "Georgia",      percentage: 2.82 },
      ],
    },
  },
  brands: {
    current: ["Apple", "AT&T", "Glu Mobile", "Heritage 66", "JD.com", "Live Nation", "Stella McCartney", "Target", "UPS"],
    mention: ["Amazon", "Billboard Music Awards", "Capital One", "Disney+", "Harper's Bazaar", "Hulu", "iHeartRadio", "Netflix", "Spotify", "Vevo", "Vogue", "YouTube"],
    prior: ["Abercrombie & Fitch", "Band Hero", "Coca-Cola", "CoverGirl", "Keds", "Sony", "Toyota", "Verizon"],
  },
  interests: ["Acting", "Animals", "Cats", "Cooking", "Country Music", "Fashion", "Literature", "Music", "Poetry", "Politics", "Pop Music", "Singing", "Travel", "Writing"],
  topics: ["Entertainment", "Music", "Food & Drink", "Cooking"],
  prices: [
    { type: { name: "Appearance" }, amount: 2500000 },
    { type: { name: "Private Performance" }, amount: 5000000 },
  ],
  causes: ["Anti-Racism", "Black Lives Matter", "Breast Cancer", "LGBTQ+", "Education", "Voting", "Gender Equality", "Women's Issues", "COVID-19 Relief"],
};

// --- Helpers -----------------------------------------------------------------
const fmt = n => n >= 1e9 ? (n/1e9).toFixed(1)+"B" : n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(0)+"K" : n?.toString() ?? "-";
const fmtPct = n => n != null ? n.toFixed(1)+"%" : "-";
const fmtUSD = n => n >= 1e6 ? "$"+(n/1e6).toFixed(1)+"M" : "$"+n?.toLocaleString();
const age = dob => dob ? Math.floor((Date.now() - new Date(dob)) / 3.15576e10) : null;

const PLATFORM_META = {
  instagram: { color: "#E1306C", label: "Instagram", icon: "IG" },
  tiktok:    { color: "#fe2c55", label: "TikTok",    icon: "TT" },
  youtube:   { color: "#FF0000", label: "YouTube",   icon: "YT" },
  facebook:  { color: "#1877F2", label: "Facebook",  icon: "FB" },
  twitter:   { color: "#1DA1F2", label: "Twitter/X", icon: "TW" },
  pinterest: { color: "#E60023", label: "Pinterest", icon: "PIN" },
  snapchat:  { color: "#FFFC00", label: "Snapchat",  icon: "SNAP" },
};

const ACCENT  = "#3b82f6";
const ACCENT2 = "#38bdf8";
const PALETTE = ["#3b82f6","#0ea5e9","#38bdf8","#6366f1","#818cf8","#2563eb","#7dd3fc"];

// --- Sub-components ----------------------------------------------------------
const Card = ({ children, style }) => (
  <div style={{ background:"#060f1e", border:"1px solid #1e1e35", borderRadius:12, padding:"18px 20px", ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#4a7ab5", marginBottom:14 }}>
    {children}
  </div>
);

const StatPill = ({ label, value, color="#a78bfa" }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1a1a2e" }}>
    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#7eb3d8" }}>{label}</span>
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color, fontWeight:500 }}>{value}</span>
  </div>
);

const Tag = ({ children, color="#3b82f622", textColor="#a78bfa" }) => (
  <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:color, color:textColor, fontSize:11, fontFamily:"'DM Sans',sans-serif", fontWeight:500, margin:"3px 3px 3px 0", border:`1px solid ${textColor}33` }}>
    {children}
  </span>
);

const HBar = ({ data, color=ACCENT, max }) => {
  const m = max || Math.max(...data.map(d => d.percentage));
  return (
    <div>
      {data.map((d,i) => (
        <div key={i} style={{ marginBottom:6 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#7eb3d8" }}>{d.label}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:PALETTE[i%PALETTE.length] }}>{fmtPct(d.percentage)}</span>
          </div>
          <div style={{ height:5, background:"#081628", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(d.percentage/m)*100}%`, background:PALETTE[i%PALETTE.length], borderRadius:3, transition:"width .6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:4, borderBottom:"1px solid #1e1e35", marginBottom:24, overflowX:"auto", paddingBottom:1 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding:"8px 16px", fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600,
        letterSpacing:1, textTransform:"uppercase", background:"none", border:"none",
        borderBottom: active===t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
        color: active===t.id ? ACCENT : "#4a7ab5", cursor:"pointer", whiteSpace:"nowrap",
        transition:"all .2s"
      }}>{t.label}</button>
    ))}
  </div>
);

const PlatformPicker = ({ platforms, active, onChange }) => (
  <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
    {platforms.map(p => {
      const meta = PLATFORM_META[p] || { color:"#fff", label:p };
      return (
        <button key={p} onClick={() => onChange(p)} style={{
          padding:"5px 12px", borderRadius:20, fontSize:11, fontFamily:"'DM Sans',sans-serif", fontWeight:500,
          border:`1px solid ${active===p ? meta.color : "#1a3358"}`,
          background: active===p ? meta.color+"22" : "transparent",
          color: active===p ? meta.color : "#4a7ab5", cursor:"pointer", transition:"all .2s"
        }}>{meta.icon} {meta.label}</button>
      );
    })}
  </div>
);

// --- Tabs ---------------------------------------------------------------------
function OverviewTab({ d }) {
  const a = age(d.dob);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:16 }}>
      {/* Profile */}
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <StatPill label="Full Name"   value={d.display_name} />
        <StatPill label="Tagline"     value={d.tagline || "-"} />
        <StatPill label="Gender"      value={d.gender || "-"} />
        {a && <StatPill label="Age"   value={`${a} years old`} />}
        <StatPill label="Born"        value={d.dob || "-"} />
        <StatPill label="Location"    value={d.current_location?.display_name || "-"} />
        <StatPill label="Julius Slug" value={d.slug} color="#4a7ab5" />
      </Card>

      {/* Totals */}
      <Card>
        <SectionTitle>Combined Reach</SectionTitle>
        <div style={{ textAlign:"center", padding:"12px 0" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:36, fontWeight:500, color:ACCENT, letterSpacing:-1 }}>{fmt(d.social_total_count)}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a7ab5", marginTop:4 }}>Total Followers</div>
        </div>
        <div style={{ height:1, background:"#0d1f3c", margin:"12px 0" }} />
        <div style={{ textAlign:"center", padding:"8px 0" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, fontWeight:500, color:ACCENT2 }}>{fmt(d.social_total_engagement)}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a7ab5", marginTop:4 }}>Total Avg. Engagement</div>
        </div>
      </Card>

      {/* Per-platform */}
      {(d.social_combined || []).map(s => {
        const meta = PLATFORM_META[s.platform] || { color:"#fff", label:s.platform, icon:"WEB" };
        return (
          <Card key={s.platform}>
            <SectionTitle>{meta.icon} {meta.label}</SectionTitle>
            <StatPill label="Followers"      value={fmt(s.statistics?.count)}      color={meta.color} />
            <StatPill label="Avg Engagement" value={fmt(s.statistics?.engagement)} color={meta.color} />
            <StatPill label="Eng. Rate"      value={fmtPct((s.statistics?.engagement_rate?.reach||0)*100)} color={meta.color} />
          </Card>
        );
      })}
    </div>
  );
}

function DemographicsTab({ d }) {
  const platforms = Object.keys(d.demographics || {});
  const [plat, setPlat] = useState(platforms[0] || "instagram");
  const dem = d.demographics?.[plat];
  if (!dem) return <div style={{ color:"#4a7ab5" }}>No demographic data available.</div>;

  return (
    <div>
      <PlatformPicker platforms={platforms} active={plat} onChange={setPlat} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:16 }}>

        {/* Age */}
        <Card>
          <SectionTitle>Age Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dem.age} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="label" tick={{ fill:"#4a7ab5", fontSize:10, fontFamily:"DM Sans" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#4a7ab5", fontSize:10, fontFamily:"DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"} />
              <Tooltip
                contentStyle={{ background:"#060f1e", border:"1px solid #1a3358", borderRadius:8, fontFamily:"DM Mono", fontSize:12, color:"#e2e2f0" }}
                labelStyle={{ color:"#7eb3d8", fontWeight:600, marginBottom:4 }}
                formatter={v=>[<span style={{color:"#e2e2f0"}}>{fmtPct(v)}</span>, "Audience"]}
                cursor={{ fill:"#1a335822" }}
              />
              <Bar dataKey="percentage" radius={[4,4,0,0]}>
                {dem.age.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gender */}
        <Card>
          <SectionTitle>Gender Split</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={dem.gender} dataKey="percentage" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {dem.gender.map((_,i) => <Cell key={i} fill={i===0 ? "#f472b6" : "#60a5fa"} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#060f1e", border:"1px solid #2a2a45", borderRadius:8, fontFamily:"DM Mono", fontSize:11 }} formatter={v=>[fmtPct(v)]} />
              <Legend formatter={(v,e) => <span style={{ fontFamily:"DM Sans", fontSize:12, color:"#7eb3d8" }}>{v}: {fmtPct(e.payload.percentage)}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Race */}
        <Card>
          <SectionTitle>Race / Ethnicity</SectionTitle>
          <HBar data={dem.race} />
        </Card>

        {/* Income */}
        <Card>
          <SectionTitle>Household Income</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dem.income} layout="vertical" margin={{top:0,right:10,bottom:0,left:10}}>
              <XAxis type="number" tick={{ fill:"#4a7ab5", fontSize:9, fontFamily:"DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"} />
              <YAxis type="category" dataKey="label" width={75} tick={{ fill:"#e2e2f0", fontSize:10, fontFamily:"DM Sans" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background:"#060f1e", border:"1px solid #1a3358", borderRadius:8, fontFamily:"DM Mono", fontSize:12, color:"#e2e2f0" }}
                labelStyle={{ color:"#7eb3d8", fontWeight:600, marginBottom:4 }}
                formatter={v=>[<span style={{color:"#e2e2f0"}}>{fmtPct(v)}</span>, "Audience"]}
                cursor={{ fill:"#1a335822" }}
              />
              <Bar dataKey="percentage" radius={[0,4,4,0]}>
                {dem.income.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  );
}

function InterestsTab({ d }) {
  const platforms = Object.keys(d.demographics || {});
  const [plat, setPlat] = useState(platforms[0] || "instagram");
  // Deduplicate by label (API returns same interest under multiple parent categories),
  // keep highest percentage, sort descending, take top 20
  const raw = d.demographics?.[plat]?.interest || [];
  const seen = new Map();
  raw.forEach(item => {
    const key = item.label;
    if (!seen.has(key) || item.percentage > seen.get(key).percentage) seen.set(key, item);
  });
  const list = [...seen.values()].sort((a,b) => b.percentage - a.percentage).slice(0,20);

  return (
    <div>
      <PlatformPicker platforms={platforms} active={plat} onChange={setPlat} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:16 }}>
        <Card style={{ gridColumn:"1 / -1" }}>
          <SectionTitle>Top Audience Interests</SectionTitle>
          <ResponsiveContainer width="100%" height={560}>
            <BarChart data={list} layout="vertical" margin={{top:8,right:55,bottom:8,left:0}}>
              <XAxis type="number" tick={{ fill:"#7eb3d8", fontSize:9, fontFamily:"DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"} />
              <YAxis type="category" dataKey="label" width={185} tick={{ fill:"#e2e2f0", fontSize:11, fontFamily:"DM Sans", fontWeight:400 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"#060f1e", border:"1px solid #1a3358", borderRadius:8, fontFamily:"DM Mono", fontSize:11, color:"#e2e2f0" }} formatter={v=>[fmtPct(v),"Audience"]} />
              <Bar dataKey="percentage" radius={[0,4,4,0]} barSize={16}>
                {list.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function BrandsAudienceTab({ d }) {
  const platforms = Object.keys(d.demographics || {});
  const [plat, setPlat] = useState(platforms[0] || "instagram");
  // Deduplicate by label, keep highest percentage, sort descending
  const raw = d.demographics?.[plat]?.brand || [];
  const seen = new Map();
  raw.forEach(item => {
    const key = item.label;
    if (!seen.has(key) || item.percentage > seen.get(key).percentage) seen.set(key, item);
  });
  const list = [...seen.values()].sort((a,b) => b.percentage - a.percentage).slice(0,20);

  return (
    <div>
      <PlatformPicker platforms={platforms} active={plat} onChange={setPlat} />
      <Card>
        <SectionTitle>Top Audience Brand Affinity</SectionTitle>
        <ResponsiveContainer width="100%" height={560}>
          <BarChart data={list} layout="vertical" margin={{top:8,right:55,bottom:8,left:0}}>
            <XAxis type="number" tick={{ fill:"#7eb3d8", fontSize:9, fontFamily:"DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"} />
            <YAxis type="category" dataKey="label" width={185} tick={{ fill:"#e2e2f0", fontSize:11, fontFamily:"DM Sans", fontWeight:400 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#060f1e", border:"1px solid #1a3358", borderRadius:8, fontFamily:"DM Mono", fontSize:11, color:"#e2e2f0" }} formatter={v=>[fmtPct(v),"Audience"]} />
            <Bar dataKey="percentage" radius={[0,4,4,0]} barSize={16}>
              {list.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function LocationsTab({ d }) {
  const platforms = Object.keys(d.demographics || {});
  const [plat, setPlat] = useState(platforms[0] || "instagram");
  const dem = d.demographics?.[plat];
  const countries = dem?.["location-by-country"]?.slice(0,12) || [];
  const states    = dem?.["location-by-us-state"]?.slice(0,12) || [];

  return (
    <div>
      <PlatformPicker platforms={platforms} active={plat} onChange={setPlat} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:16 }}>
        <Card>
          <SectionTitle>Top Countries</SectionTitle>
          <HBar data={countries} />
        </Card>
        <Card>
          <SectionTitle>Top US States</SectionTitle>
          <HBar data={states} />
        </Card>
      </div>
    </div>
  );
}

function ProfileTab({ d }) {
  // Real API returns objects {tag, display_name, source_url}; demo uses plain strings -- handle both
  const getName = x => (typeof x === "string" ? x : x?.display_name ?? "");
  const getUrl  = x => (typeof x === "string" ? null : x?.source_url || null);

  const BrandRow = ({ item, color, bg }) => {
    const name = getName(item);
    const url  = getUrl(item);
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #081628" }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#e2e2f0" }}>{name}</span>
        {url
          ? <a href={url} target="_blank" rel="noopener noreferrer" style={{
              fontFamily:"'DM Mono',monospace", fontSize:10, color, background:bg,
              border:`1px solid ${color}44`, borderRadius:12, padding:"2px 10px",
              textDecoration:"none", whiteSpace:"nowrap", flexShrink:0, marginLeft:8
            }}>View Post</a>
          : <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#1a3358" }}>no link</span>
        }
      </div>
    );
  };

  const causes = d.causes
    || (d.tags||[]).filter(t=>t.tag?.startsWith("cause.")).map(t=>t.display_name);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:16 }}>

      {d.brands?.current?.length > 0 && (
        <Card>
          <SectionTitle>Current Brand Deals ({d.brands.current.length})</SectionTitle>
          {d.brands.current.map((b,i) => <BrandRow key={i} item={b} color="#34d399" bg="#05281922" />)}
        </Card>
      )}
      {d.brands?.mention?.length > 0 && (
        <Card>
          <SectionTitle>Brand Mentions ({d.brands.mention.length})</SectionTitle>
          {d.brands.mention.map((b,i) => <BrandRow key={i} item={b} color="#60a5fa" bg="#0c1f3a22" />)}
        </Card>
      )}
      {d.brands?.prior?.length > 0 && (
        <Card>
          <SectionTitle>Prior Brand Deals ({d.brands.prior.length})</SectionTitle>
          {d.brands.prior.map((b,i) => <BrandRow key={i} item={b} color="#94a3b8" bg="#1a243522" />)}
        </Card>
      )}
      {d.brands?.supported?.length > 0 && (
        <Card>
          <SectionTitle>Brand Supporter ({d.brands.supported.length})</SectionTitle>
          {d.brands.supported.map((b,i) => <BrandRow key={i} item={b} color="#f472b6" bg="#2d0a2022" />)}
        </Card>
      )}
      {d.interests?.length > 0 && (
        <Card>
          <SectionTitle>Personal Interests</SectionTitle>
          <div>{d.interests.map((item,i) => <Tag key={i}>{getName(item)}</Tag>)}</div>
        </Card>
      )}
      {d.topics?.length > 0 && (
        <Card>
          <SectionTitle>Topics</SectionTitle>
          <div>{d.topics.map((t,i) => <Tag key={i} color="#1e3a8a22" textColor="#60a5fa">{getName(t)}</Tag>)}</div>
        </Card>
      )}
      {causes?.length > 0 && (
        <Card>
          <SectionTitle>Causes</SectionTitle>
          <div>{causes.map(c => <Tag key={c} color="#f472b622" textColor="#f472b6">{c}</Tag>)}</div>
        </Card>
      )}
      {d.prices?.length > 0 && (
        <Card>
          <SectionTitle>Estimated Pricing</SectionTitle>
          {d.prices.map((p,i) => <StatPill key={i} label={p.type?.name} value={fmtUSD(p.amount)} color={ACCENT2} />)}
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#2a5a8a", marginTop:10 }}>Pricing is estimated and may not reflect current rates.</div>
        </Card>
      )}
    </div>
  );
}


// --- Relationship Badge -------------------------------------------------------
const REL_META = {
  current:   { label:"Active Partnership", color:"#34d399", bg:"#05281922", icon:"[*]" },
  mention:   { label:"Brand Mention",      color:"#60a5fa", bg:"#0c1f3a22", icon:"[c]" },
  prior:     { label:"Past Partnership",   color:"#94a3b8", bg:"#1a243522", icon:"[f]" },
  supported: { label:"Brand Supporter",    color:"#f472b6", bg:"#2d0a2022", icon:"[h]" },
  associated:{ label:"Associated",         color:"#7eb3d8", bg:"#0d1f3c22", icon:"[->]" },
};

function BrandResultCard({ inf, onViewProfile }) {
  const rel  = REL_META[inf.relationship] || REL_META.associated;
  const plat = inf.topPlatform ? (PLATFORM_META[inf.topPlatform] || { label: inf.topPlatform, icon:"WEB" }) : null;
  return (
    <div style={{
      background:"#060f1e", border:`1px solid #0d1f3c`,
      borderRadius:12, padding:"18px 20px", display:"flex", flexDirection:"column", gap:12,
      transition:"border-color .2s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = rel.color + "66"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#0d1f3c"}
    >
      {/* Top row: avatar + name + badge */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {inf.avatar?.url
          ? <img src={inf.avatar.url} alt={inf.display_name} style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:`2px solid ${rel.color}44`, flexShrink:0 }} />
          : <div style={{ width:48, height:48, borderRadius:"50%", background:"#0d1f3c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}></div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{inf.display_name}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#4a7ab5", marginTop:2 }}>{inf.tagline || inf.current_location?.display_name || "-"}</div>
        </div>
      </div>

      {/* Relationship badge */}
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:rel.bg, border:`1px solid ${rel.color}44`, alignSelf:"flex-start" }}>
        <span style={{ fontSize:13 }}>{rel.icon}</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, letterSpacing:1, color:rel.color, textTransform:"uppercase" }}>{rel.label}</span>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color:ACCENT }}>{fmt(inf.social_total_count)}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#4a7ab5" }}>Total Followers</div>
        </div>
        {plat && (
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color:plat.color || "#7eb3d8" }}>{fmt(inf.topPlatformCount)}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#4a7ab5" }}>{plat.icon} {plat.label}</div>
          </div>
        )}
      </div>

      {/* Source link if available */}
      {inf.sourceUrl && (
        <a href={inf.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#3b82f6", textDecoration:"none", wordBreak:"break-all" }}>
           Source post
        </a>
      )}

      {/* View profile button */}
      <button onClick={() => onViewProfile(inf.slug)} style={{
        marginTop:4, padding:"7px 0", borderRadius:8, fontSize:11, fontFamily:"'Syne',sans-serif",
        fontWeight:600, letterSpacing:1, textTransform:"uppercase", border:`1px solid #1a3358`,
        background:"transparent", color:"#7eb3d8", cursor:"pointer", transition:"all .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#0d1f3c"; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#1a3358"; e.currentTarget.style.color = "#7eb3d8"; }}
      >View Full Profile {"->"}
      </button>
    </div>
  );
}

function BrandSearchPanel({ onViewProfile }) {
  const [brandQuery,   setBrandQuery]   = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [brandResults, setBrandResults] = useState(null);
  const [allResults,   setAllResults]   = useState([]);
  const [brandError,   setBrandError]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [sortField,    setSortField]    = useState("reach-instagram");
  const PAGE_SIZE = 20;

  const SORT_OPTIONS = [
    { value:"reach-instagram", label:"Instagram Reach" },
    { value:"reach-tiktok",    label:"TikTok Reach" },
    { value:"reach",           label:"Total Reach" },
    { value:"engagement",      label:"Engagement" },
  ];

  const fetchPage = async (page = 1, isNewSearch = false) => {
    const loadSetter = isNewSearch ? setBrandLoading : setPageLoading;
    loadSetter(true);
    setBrandError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        brand:  brandQuery.trim(),
        limit:  PAGE_SIZE,
        offset,
        sort:   sortField,
      });
      const res  = await fetch(`/api/julius-brand?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Brand search failed");
      setBrandResults(json);
      setAllResults(json.results || []);
    } catch (e) { setBrandError(e.message); }
    finally { loadSetter(false); }
  };

  const searchBrand = async () => {
    if (!brandQuery.trim()) return;
    setCurrentPage(1);
    setBrandResults(null);
    await fetchPage(1, true);
  };

  const goNextPage = async () => {
    const next = currentPage + 1;
    setCurrentPage(next);
    await fetchPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrevPage = async () => {
    if (currentPage <= 1) return;
    const prev = currentPage - 1;
    setCurrentPage(prev);
    await fetchPage(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const relCounts = allResults.length ? {
    current:   allResults.filter(r => r.relationship === "current").length,
    mention:   allResults.filter(r => r.relationship === "mention").length,
    prior:     allResults.filter(r => r.relationship === "prior").length,
    supported: allResults.filter(r => r.relationship === "supported").length,
  } : null;

  const isLoading = brandLoading || pageLoading;

  return (
    <div>
      {/* Search bar + sort */}
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        <input
          value={brandQuery}
          onChange={e => setBrandQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchBrand()}
          placeholder="e.g. Nike, Coca-Cola, Victoria's Secret"
          style={{
            flex:1, minWidth:200, padding:"8px 16px", borderRadius:20, fontSize:13,
            fontFamily:"'DM Sans',sans-serif", background:"#060f1e", border:"1px solid #1a3358",
            color:"#e2e2f0", outline:"none"
          }}
        />
        <select value={sortField} onChange={e => setSortField(e.target.value)} style={{
          padding:"8px 14px", borderRadius:20, fontSize:12, fontFamily:"'DM Sans',sans-serif",
          background:"#060f1e", border:"1px solid #1a3358", color:"#7eb3d8", cursor:"pointer", outline:"none"
        }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={searchBrand} disabled={isLoading} style={{
          padding:"8px 24px", borderRadius:20, fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700,
          letterSpacing:1, textTransform:"uppercase", background: isLoading ? "#1a3358" : ACCENT,
          border:"none", color:"#fff", cursor: isLoading ? "default" : "pointer"
        }}>{brandLoading ? "Searching..." : "Search"}</button>
      </div>

      {brandError && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:"#2d0a0a", border:"1px solid #5c1a1a", color:"#f87171", fontSize:13, marginBottom:20 }}>
          {brandError}
        </div>
      )}

      {brandResults && (
        <>
          {/* Summary bar */}
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:"14px 20px", background:"#060f1e", borderRadius:12, border:"1px solid #0d1f3c", flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#fff" }}>{brandResults.brand}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#4a7ab5", marginLeft:10 }}>{brandResults.brandSlug}</span>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#4a7ab5" }}>
              {brandResults.total?.toLocaleString() || "?"} total results
            </div>
            {relCounts && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {relCounts.current   > 0 && <span style={{ padding:"3px 10px", borderRadius:20, background:"#05281922", border:"1px solid #34d39944", color:"#34d399", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>Active {relCounts.current}</span>}
                {relCounts.mention   > 0 && <span style={{ padding:"3px 10px", borderRadius:20, background:"#0c1f3a22", border:"1px solid #60a5fa44", color:"#60a5fa", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>Mentions {relCounts.mention}</span>}
                {relCounts.prior     > 0 && <span style={{ padding:"3px 10px", borderRadius:20, background:"#1a243522", border:"1px solid #94a3b844", color:"#94a3b8", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>Past {relCounts.prior}</span>}
                {relCounts.supported > 0 && <span style={{ padding:"3px 10px", borderRadius:20, background:"#2d0a2022", border:"1px solid #f472b644", color:"#f472b6", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>Supporter {relCounts.supported}</span>}
              </div>
            )}
          </div>

          {/* Loading overlay for page turns */}
          {pageLoading && (
            <div style={{ textAlign:"center", padding:"48px", color:"#4a7ab5", fontFamily:"'DM Sans',sans-serif" }}>
              Loading page {currentPage}...
            </div>
          )}

          {!pageLoading && allResults.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px 24px", color:"#4a7ab5", fontFamily:"'DM Sans',sans-serif" }}>
              No influencers found for <strong style={{ color:"#7eb3d8" }}>{brandResults.brand}</strong>.
            </div>
          )}

          {!pageLoading && allResults.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:16 }}>
              {allResults.map(inf => (
                <BrandResultCard key={inf.slug || inf.id} inf={inf} onViewProfile={onViewProfile} />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {!pageLoading && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginTop:32, paddingTop:24, borderTop:"1px solid #0d1f3c" }}>
              <button
                onClick={goPrevPage}
                disabled={currentPage <= 1 || isLoading}
                style={{
                  padding:"8px 24px", borderRadius:20, fontSize:12, fontFamily:"'Syne',sans-serif",
                  fontWeight:600, letterSpacing:1, textTransform:"uppercase",
                  border:`1px solid ${currentPage <= 1 ? "#0d1f3c" : "#1a3358"}`,
                  background:"transparent",
                  color: currentPage <= 1 ? "#1a3358" : "#7eb3d8",
                  cursor: currentPage <= 1 ? "default" : "pointer"
                }}
              >{"<"} Prev</button>

              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#4a7ab5" }}>
                Page {currentPage}
                {brandResults.total && ` of ~${Math.ceil(brandResults.total / PAGE_SIZE)}`}
              </span>

              <button
                onClick={goNextPage}
                disabled={!brandResults.hasMore || isLoading}
                style={{
                  padding:"8px 24px", borderRadius:20, fontSize:12, fontFamily:"'Syne',sans-serif",
                  fontWeight:600, letterSpacing:1, textTransform:"uppercase",
                  border:`1px solid ${!brandResults.hasMore ? "#0d1f3c" : ACCENT}`,
                  background: !brandResults.hasMore ? "transparent" : ACCENT+"22",
                  color: !brandResults.hasMore ? "#1a3358" : ACCENT,
                  cursor: !brandResults.hasMore ? "default" : "pointer"
                }}
              >Next {">"}</button>
            </div>
          )}
        </>
      )}

      {!brandResults && !brandLoading && (
        <div style={{ textAlign:"center", padding:"64px 24px", color:"#4a7ab5" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>[ ]</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:600, color:"#7eb3d8", marginBottom:8 }}>Search by Brand</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Enter a brand name to find influencers who have active partnerships, mentions, or past deals.</div>
        </div>
      )}
    </div>
  );
}

// --- Main Component -----------------------------------------------------------
export default function JuliusInfluencerLookup() {
  const [appMode,   setAppMode]   = useState("influencer"); // "influencer" | "brand"
  const [mode,      setMode]      = useState("handle");
  const [platform,  setPlatform]  = useState("instagram");
  const [query,     setQuery]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [data,      setData]      = useState(null);
  const [error,     setError]     = useState(null);
  const [demoMode,  setDemoMode]  = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const displayData = demoMode ? DEMO : data;// demo hidden by default

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setData(null);
    try {
      const params = mode === "handle"
        ? `mode=handle&platform=${platform}&handle=${encodeURIComponent(query.trim())}`
        : `mode=slug&slug=${encodeURIComponent(query.trim())}`;
      const res  = await fetch(`/api/julius?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lookup failed");
      // Debug: log brands structure to see if source_url exists
      console.log("brands.current sample:", json.brands?.current?.slice(0,2));
      console.log("brands.mention sample:", json.brands?.mention?.slice(0,2));
      console.log("brands.prior sample:",   json.brands?.prior?.slice(0,2));
      setData(json);
      setDemoMode(false);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Called from brand search cards to jump to influencer lookup
  const viewProfile = (slug) => {
    setAppMode("influencer");
    setMode("slug");
    setQuery(slug);
    setData(null);
    // auto-search after state settles
    setTimeout(() => {
      fetch(`/api/julius?mode=slug&slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(json => { setData(json); setDemoMode(false); })
        .catch(e => setError(e.message));
    }, 50);
  };

  const TABS = [
    { id:"overview",   label:"Overview" },
    { id:"demographics", label:"Demographics" },
    { id:"interests",  label:"Interests" },
    { id:"brands",     label:"Audience Brands" },
    { id:"locations",  label:"Locations" },
    { id:"profile",    label:"Profile" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#040c18", color:"#e2e2f0", fontFamily:"'DM Sans',sans-serif", padding:"32px 24px" }}>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { width:4px; height:4px; background:#0a0a12; } ::-webkit-scrollbar-thumb { background:#2a2a45; border-radius:4px; }`}</style>

      {/* Header */}
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, margin:0, letterSpacing:-0.5, color:"#fff" }}>
              Influencer Intelligence <span style={{ color:ACCENT, fontSize:16, fontWeight:600 }}>powered by Julius</span>
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a7ab5", margin:"4px 0 0" }}>Influencer data & audience analytics</p>
          </div>
          {/* App mode switcher */}
          <div style={{ display:"flex", gap:6, background:"#060f1e", border:"1px solid #0d1f3c", borderRadius:24, padding:4 }}>
            {[["influencer"," Influencer"],["brand"," Brand"]].map(([id,label]) => (
              <button key={id} onClick={() => setAppMode(id)} style={{
                padding:"7px 18px", borderRadius:20, fontSize:11, fontFamily:"'Syne',sans-serif", fontWeight:700,
                letterSpacing:1, textTransform:"uppercase", border:"none",
                background: appMode===id ? ACCENT : "transparent",
                color: appMode===id ? "#fff" : "#4a7ab5", cursor:"pointer", transition:"all .2s"
              }}>{label}</button>
            ))}
          </div>
          </div>

        {/* Influencer Search Mode */}
        {appMode === "influencer" && (<>
          <div style={{ display:"flex", gap:10, marginBottom:32, flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:6 }}>
              {["handle","slug"].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding:"8px 16px", borderRadius:20, fontSize:11, fontFamily:"'Syne',sans-serif", fontWeight:600,
                  letterSpacing:1, textTransform:"uppercase", border:`1px solid ${mode===m ? ACCENT : "#1a3358"}`,
                  background: mode===m ? ACCENT+"22" : "transparent", color: mode===m ? ACCENT : "#4a7ab5", cursor:"pointer"
                }}>{m === "handle" ? "@ Handle" : "Slug / ID"}</button>
              ))}
            </div>
            {mode === "handle" && (
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{
                padding:"8px 14px", borderRadius:20, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                background:"#060f1e", border:"1px solid #1a3358", color:"#7eb3d8", cursor:"pointer", outline:"none"
              }}>
                {["instagram","tiktok","youtube","facebook","twitter","pinterest","snapchat"].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                ))}
              </select>
            )}
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder={mode === "handle" ? "e.g. taylorswift" : "e.g. taylor-swift"}
              style={{
                flex:1, minWidth:200, padding:"8px 16px", borderRadius:20, fontSize:13,
                fontFamily:"'DM Sans',sans-serif", background:"#060f1e", border:"1px solid #1a3358",
                color:"#e2e2f0", outline:"none"
              }}
            />
            <button onClick={search} disabled={loading} style={{
              padding:"8px 24px", borderRadius:20, fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700,
              letterSpacing:1, textTransform:"uppercase", background: loading ? "#1a3358" : ACCENT,
              border:"none", color:"#fff", cursor: loading ? "default" : "pointer"
            }}>{loading ? "..." : "Search"}</button>
          </div>

          {error && (
            <div style={{ padding:"12px 16px", borderRadius:10, background:"#2d0a0a", border:"1px solid #5c1a1a", color:"#f87171", fontSize:13, marginBottom:20 }}>
              {error}
            </div>
          )}

          {displayData && (
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32, padding:"20px 24px", background:"#060f1e", borderRadius:14, border:"1px solid #0d1f3c" }}>
              {displayData.avatar?.url && (
                <img src={displayData.avatar.url} alt={displayData.display_name}
                  style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", border:"2px solid #1a3358" }} />
              )}
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, margin:0, color:"#fff" }}>{displayData.display_name}</h2>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#4a7ab5", marginTop:2 }}>
                  {displayData.tagline} {displayData.current_location?.display_name && `. ${displayData.current_location.display_name}`}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:500, color:ACCENT }}>{fmt(displayData.social_total_count)}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#4a7ab5" }}>total followers</div>
              </div>
            </div>
          )}

          {displayData && (
            <>
              <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
              {activeTab === "overview"      && <OverviewTab d={displayData} />}
              {activeTab === "demographics"  && <DemographicsTab d={displayData} />}
              {activeTab === "interests"     && <InterestsTab d={displayData} />}
              {activeTab === "brands"        && <BrandsAudienceTab d={displayData} />}
              {activeTab === "locations"     && <LocationsTab d={displayData} />}
              {activeTab === "profile"       && <ProfileTab d={displayData} />}
            </>
          )}
        </>)}

        {/* Brand Search Mode */}
        {appMode === "brand" && (
          <BrandSearchPanel onViewProfile={viewProfile} />
        )}
      </div>
    </div>
  );
}
