"use client";
import { useState } from "react";
import {
    Download, ClipboardCheck, TrendingUp, Users2,
    Clock, AlertTriangle, MapPin, ChevronRight,
    ArrowUpRight, Wrench, Flame,
} from "lucide-react";

const DISTRESSED_ASSETS = [
    { name: "Khandala Ridge Estate", sub: "Red Zone • 45.2 Acres",   urgency: "48h Left", urgencyColor: "#ef4444" },
    { name: "Panvel Logistics Hub",  sub: "Open Zone • 112 Acres",   urgency: "72h Left", urgencyColor: "#f97316" },
    { name: "Nashik Valley Plot 7",  sub: "Orange Zone • 28 Acres",  urgency: "5d Left",  urgencyColor: "#c9a84c" },
    { name: "Pune East Industrial",  sub: "White Zone • 64 Acres",   urgency: "7d Left",  urgencyColor: "#c9a84c" },
];

const LIQUID_PARTNERS = [
    { name: "Global Infra Fund #09", sub: "Budget: $25M+ • Preferred: Open/Orange", badge: "LIQUID" },
    { name: "Apex Realty Group",     sub: "Budget: $15M+ • Preferred: Any Zone",    badge: "LIQUID" },
    { name: "Meridian Capital Ltd",  sub: "Budget: $8M+ • Preferred: Industrial",   badge: "LIQUID" },
    { name: "Bharat Land Trust",     sub: "Budget: $30M+ • Preferred: Freehold",    badge: "LIQUID" },
];
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

const GOLD   = "#c9a84c";
const NAVY   = "#1a2d4a";
const CREAM  = "#f5f2ed";
const DARK   = "#0f1c2e";

const ZONES = [
    { name: "Open Zone (Freehold)",      value: 5200, color: NAVY,      label: "5.2k" },
    { name: "Orange Zone (Semi-Industrial)", value: 3100, color: GOLD,  label: "3.1k" },
    { name: "White Zone (Institutional)", value: 1800, color: "#8a9bb0", label: "1.8k" },
    { name: "Red Zone (Restricted)",     value: 2300, color: "#2a2a2a", label: "2.3k" },
];

const ACTIVITY = [
    {
        icon: MapPin,
        text: <><strong>Rahul Varma</strong> updated boundaries for <strong>Emerald Meadows (Lot 14)</strong></>,
        time: "Today at 10:45 AM",
        tag:  "Property Management",
    },
    {
        icon: TrendingUp,
        text: <><strong>System</strong> generated revenue forecast for <strong>Q4 Strategic Land Acquisitions</strong></>,
        time: "Today at 09:12 AM",
        tag:  "Financial Pipeline",
    },
    {
        icon: ClipboardCheck,
        text: <><strong>Director Audit</strong> approved Title Verification for <strong>South Coast Commercial Hub</strong></>,
        time: "Yesterday at 4:30 PM",
        tag:  "User Management",
    },
    {
        icon: MapPin,
        text: <><strong>GIS Engine</strong> synced 14 new satellite overlay layers for <strong>Northern Frontier Zone</strong></>,
        time: "Yesterday at 11:20 AM",
        tag:  "GIS/Map",
    },
];

const AVATARS = ["RV", "SA", "PK", "DA", "MN"];

function StatCard({ label, value, unit, sub, subColor, children }) {
    return (
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col gap-2 min-w-0">
            <p className="text-[11px] font-semibold text-[#9a8e7a] uppercase tracking-wider">{label}</p>
            <div className="flex items-end gap-1.5">
                <span className="text-[2.2rem] font-bold leading-none" style={{ color: NAVY }}>{value}</span>
                {unit && <span className="text-sm font-semibold text-[#9a8e7a] mb-1">{unit}</span>}
            </div>
            {sub && (
                <p className="text-xs font-semibold" style={{ color: subColor ?? "#9a8e7a" }}>{sub}</p>
            )}
            {children}
        </div>
    );
}

function DonutCenter({ cx, cy }) {
    return (
        <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill={NAVY} fontSize={22} fontWeight={700}>12.4k</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#9a8e7a" fontSize={9} fontWeight={600} letterSpacing={1}>TOTAL ACRES</text>
        </>
    );
}

export default function DashboardPage() {
    const [zoneFilter, setZoneFilter] = useState("ALL REGIONS");
    const [fyFilter,   setFyFilter]   = useState("FY 2024");

    return (
        <div className="min-h-full space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1
                        className="text-[2rem] font-bold leading-tight"
                        style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                    >
                        Executive Overview
                    </h1>
                    <p className="text-sm text-[#7a6e5f] mt-1 max-w-lg">
                        Real-time performance analytics for your institutional land portfolio and
                        strategic development pipeline.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors hover:bg-[#f0ece4]"
                        style={{ borderColor: "#d4c9b0", color: NAVY }}
                    >
                        <Download size={14} />
                        Download Report
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: NAVY }}
                    >
                        <ClipboardCheck size={14} />
                        Property Audit
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                <StatCard label="Total Land Bank" value="12,480" unit="Acres">
                    <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#16a34a" }}>
                        <TrendingUp size={11} />
                        +14% from last quarter
                    </p>
                </StatCard>

                <StatCard label="Active Buyer Leads" value="842">
                    <div className="flex items-center gap-2 mt-0.5">
                        <Users2 size={13} style={{ color: GOLD }} />
                        <p className="text-xs text-[#9a8e7a] font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#c9a84c] inline-block mr-1" />
                            128 High Intent Users
                        </p>
                    </div>
                </StatCard>

                <StatCard label="Pending Acquisitions" value="24" unit="Deals">
                    {/* progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#e8e2d8] mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: "60%", background: GOLD }} />
                    </div>
                </StatCard>

                <StatCard label="Revenue Pipeline" value="$42.8" unit="M">
                    <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#9a8e7a" }}>
                        <ClipboardCheck size={11} style={{ color: GOLD }} />
                        Audited Projection
                    </p>
                </StatCard>

            </div>

            {/* ── Zone chart + Critical alerts ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Zone chart */}
                <div className="xl:col-span-2 bg-white border border-[#e8e2d8] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2
                                className="text-xl font-bold leading-tight"
                                style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                            >
                                Zone-Based Property<br />Insights
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {["ALL REGIONS", "NORTH", "SOUTH"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setZoneFilter(f)}
                                    className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-colors"
                                    style={{
                                        background: zoneFilter === f ? NAVY : "#f0ece4",
                                        color:      zoneFilter === f ? "#fff" : "#7a6e5f",
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                            {["FY 2024", "FY 2023"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFyFilter(f)}
                                    className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-colors"
                                    style={{
                                        background: fyFilter === f ? GOLD : "#f0ece4",
                                        color:      fyFilter === f ? "#fff" : "#7a6e5f",
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Donut */}
                        <div className="shrink-0" style={{ width: 200, height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ZONES}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={62}
                                        outerRadius={88}
                                        dataKey="value"
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {ZONES.map((z, i) => (
                                            <Cell key={i} fill={z.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e2d8" }}
                                        formatter={(v) => [`${(v/1000).toFixed(1)}k acres`, ""]}
                                    />
                                    <DonutCenter cx={100} cy={100} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-3">
                            {ZONES.map((z, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: z.color }} />
                                        <span className="text-sm text-[#4a3f2f]">{z.name}</span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: NAVY }}>{z.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Critical alerts */}
                <div
                    className="rounded-xl p-5 flex flex-col gap-4"
                    style={{ background: DARK }}
                >
                    <div className="flex items-center justify-between">
                        <h2
                            className="text-lg font-bold text-white"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Critical Alerts
                        </h2>
                        <div
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: GOLD, color: DARK }}
                        >
                            !
                        </div>
                    </div>

                    {/* Alert 1 */}
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: "#162030" }}>
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[9px] font-bold tracking-widest uppercase"
                                style={{ color: GOLD }}
                            >
                                Missing Metadata
                            </span>
                            <span className="text-[10px] text-[#7a8fa6]">2h ago</span>
                        </div>
                        <p className="text-sm font-bold text-white">Karakoram Estate Phase III</p>
                        <p className="text-[11px] text-[#7a8fa6] leading-relaxed">
                            Gat numbers 402-408 are missing validated registry links.
                        </p>
                        <button
                            className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 mt-1 hover:opacity-70 transition-opacity"
                            style={{ color: GOLD }}
                        >
                            Fix Data <ArrowUpRight size={10} />
                        </button>
                    </div>

                    {/* Alert 2 */}
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: "#162030" }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold tracking-widest uppercase text-orange-400">
                                GIS Discrepancy
                            </span>
                            <span className="text-[10px] text-[#7a8fa6]">5h ago</span>
                        </div>
                        <p className="text-sm font-bold text-white">Riverlands Green Belt</p>
                        <p className="text-[11px] text-[#7a8fa6] leading-relaxed">
                            Map polygon overlaps with neighboring Survey No. 12.
                        </p>
                        <button className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 mt-1 text-orange-400 hover:opacity-70 transition-opacity">
                            Resolve Map <Wrench size={10} />
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Emergency Liquidation Pipeline ── */}
            <LiquidationPipeline />

            {/* ── Portfolio Activity Log ── */}
            <div className="bg-white border border-[#e8e2d8] rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2
                        className="text-xl font-bold"
                        style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                    >
                        Portfolio Activity Log
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Avatar stack */}
                        <div className="flex items-center">
                            {AVATARS.map((a, i) => (
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                                    style={{
                                        background: [NAVY, GOLD, "#6b7f95", "#2a3f5f", "#8a6f3a"][i],
                                        marginLeft: i > 0 ? "-8px" : 0,
                                        zIndex: AVATARS.length - i,
                                    }}
                                >
                                    {a}
                                </div>
                            ))}
                            <div
                                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ background: "#9a8e7a", marginLeft: "-8px" }}
                            >
                                +12
                            </div>
                        </div>
                        <button
                            className="text-xs font-bold tracking-wider flex items-center gap-1 hover:opacity-70 transition-opacity"
                            style={{ color: NAVY }}
                        >
                            VIEW ALL LOGS <ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ACTIVITY.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <div key={i} className="flex items-start gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: "#f0ece4" }}
                                >
                                    <Icon size={14} style={{ color: NAVY }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-[#2a2a2a] leading-snug">{a.text}</p>
                                    <p className="text-[11px] text-[#9a8e7a] mt-0.5">
                                        {a.time} • <span style={{ color: GOLD }}>{a.tag}</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Asset highlight ── */}
            <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5">

                    {/* Image side */}
                    <div className="md:col-span-3 relative min-h-[260px]">
                        <img
                            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"
                            alt="Western Corridor Hub"
                            className="w-full h-full object-cover"
                            style={{ minHeight: 260 }}
                        />
                        {/* Gradient overlay */}
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to top, rgba(10,18,30,0.85) 0%, transparent 55%)" }}
                        />
                        <div className="absolute bottom-0 left-0 p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <MapPin size={11} style={{ color: GOLD }} />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">
                                    Maharashtra, India
                                </span>
                            </div>
                            <h3
                                className="text-2xl font-bold text-white leading-tight"
                                style={{ fontFamily: "Georgia, serif" }}
                            >
                                Western Corridor Hub
                            </h3>
                            <p className="text-[12px] text-white/60 mt-1 max-w-sm leading-relaxed">
                                Strategic development zone featuring 240 acres of prime Open Zone land
                                with ready industrial infrastructure.
                            </p>
                        </div>
                    </div>

                    {/* Details side */}
                    <div className="md:col-span-2 p-6 flex flex-col justify-between">
                        <div>
                            <p
                                className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                                style={{ color: GOLD }}
                            >
                                Asset Highlight
                            </p>
                            <h2
                                className="text-3xl font-bold leading-tight mb-6"
                                style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                            >
                                Investment<br />Ready
                            </h2>

                            <div className="space-y-4">
                                {[
                                    { label: "Registry Status",   value: "VERIFIED",    valueStyle: { color: "#16a34a", fontWeight: 700 } },
                                    { label: "Total Area",        value: "240.5 Acres",  valueStyle: { color: NAVY, fontWeight: 600 } },
                                    { label: "Current Valuation", value: "$18.2 M",      valueStyle: { color: NAVY, fontWeight: 600 } },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-[#f0ece4] pb-3">
                                        <span className="text-sm text-[#7a6e5f]">{row.label}</span>
                                        <span className="text-sm" style={row.valueStyle}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="mt-6 w-full py-3 rounded-lg text-sm font-bold tracking-wider text-white transition-opacity hover:opacity-90"
                            style={{ background: NAVY }}
                        >
                            VIEW FULL GIS DATA
                        </button>
                    </div>
                </div>
            </div>



        </div>
    );
}

const INSTANT_BUYERS = [
    {
        name:       "Global Infra Fund #09",
        type:       "Institutional Fund",
        budget:     "$25M+",
        zones:      ["Open", "Orange"],
        response:   "Same Day",
        responseColor: "#16a34a",
        status:     "ACTIVE",
        statusColor:"#16a34a",
    },
    {
        name:       "Apex Realty Group",
        type:       "Private Developer",
        budget:     "$15M+",
        zones:      ["Any Zone"],
        response:   "24h",
        responseColor: "#16a34a",
        status:     "ACTIVE",
        statusColor:"#16a34a",
    },
    {
        name:       "Meridian Capital Ltd",
        type:       "PE Fund",
        budget:     "$8M+",
        zones:      ["Industrial", "White"],
        response:   "48h",
        responseColor: "#c9a84c",
        status:     "ON HOLD",
        statusColor:"#c9a84c",
    },
    {
        name:       "Bharat Land Trust",
        type:       "Government Body",
        budget:     "$30M+",
        zones:      ["Freehold"],
        response:   "Same Day",
        responseColor: "#16a34a",
        status:     "ACTIVE",
        statusColor:"#16a34a",
    },
    {
        name:       "Sunrise Ventures Pvt Ltd",
        type:       "Family Office",
        budget:     "$5M+",
        zones:      ["Open", "Red"],
        response:   "72h",
        responseColor: "#f97316",
        status:     "NEGOTIATING",
        statusColor:"#3b82f6",
    },
    {
        name:       "Western Realty Partners",
        type:       "REIT",
        budget:     "$50M+",
        zones:      ["Any Zone"],
        response:   "Same Day",
        responseColor: "#16a34a",
        status:     "ACTIVE",
        statusColor:"#16a34a",
    },
];

// ─── Liquidation Pipeline Component ─────────────────────────────────────────
function LiquidationPipeline() {
    const [activeTab, setActiveTab] = useState("sellers");

    return (
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-6">

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2
                        className="text-2xl font-bold"
                        style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                    >
                        Emergency Liquidation Pipeline
                    </h2>
                    <span
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                        style={{ background: "#fff1f0", color: "#ef4444", border: "1px solid #fecaca" }}
                    >
                        <Flame size={11} />
                        HIGH URGENCY
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center">
                    {[
                        { key: "sellers", label: "URGENT SELLERS" },
                        { key: "buyers",  label: "INSTANT BUYERS"  },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className="px-4 pb-2 text-[12px] font-bold tracking-wider transition-all"
                            style={{
                                color:        activeTab === t.key ? NAVY : "#9a8e7a",
                                borderBottom: activeTab === t.key ? `2px solid ${GOLD}` : "2px solid transparent",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── URGENT SELLERS tab ── */}
            {activeTab === "sellers" && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

                    {/* Left — Distressed Assets */}
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#9a8e7a] mb-3">
                            Distressed Assets
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {DISTRESSED_ASSETS.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between px-4 py-3 rounded-lg border transition-colors cursor-pointer hover:bg-[#fafaf8]"
                                    style={{ borderColor: "#e8e2d8" }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{a.name}</p>
                                        <p className="text-[11px] text-[#9a8e7a] mt-0.5">{a.sub}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-bold" style={{ color: a.urgencyColor }}>
                                            {a.urgency}
                                        </span>
                                        <ChevronRight size={14} style={{ color: "#9a8e7a" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — High Liquidity Partners */}
                    {/* <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#9a8e7a] mb-3">
                            High Liquidity Partners
                        </p>
                        <div className="space-y-2">
                            {LIQUID_PARTNERS.map((p, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between px-4 py-3 rounded-lg border transition-colors cursor-pointer hover:bg-[#fafaf8]"
                                    style={{ borderColor: "#e8e2d8" }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{p.name}</p>
                                        <p className="text-[11px] text-[#9a8e7a] mt-0.5">{p.sub}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                                            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}
                                        >
                                            {p.badge}
                                        </span>
                                        <ChevronRight size={14} style={{ color: "#9a8e7a" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div> */}
                </div>
            )}

            {/* ── INSTANT BUYERS tab ── */}
            {activeTab === "buyers" && (
                <div>
                    {/* Summary strip */}
                    <div
                        className="flex items-center gap-6 px-4 py-3 rounded-lg mb-4 flex-wrap"
                        style={{ background: "#f5f2ed" }}
                    >
                        {[
                            { label: "Total Buyers",     value: `${INSTANT_BUYERS.length}`                                          },
                            { label: "Active Now",       value: `${INSTANT_BUYERS.filter(b => b.status === "ACTIVE").length}`,  color: "#16a34a" },
                            { label: "Total Capacity",   value: "$148M+",                                                         color: GOLD     },
                            { label: "Avg. Response",    value: "18h"                                                                              },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[10px] text-[#9a8e7a] font-semibold uppercase tracking-wider">{s.label}</span>
                                <span className="text-base font-bold mt-0.5" style={{ color: s.color ?? NAVY }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Table header */}
                    <div
                        className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold tracking-wider uppercase text-[#9a8e7a] border-b"
                        style={{ borderColor: "#e8e2d8" }}
                    >
                        <span className="col-span-4">Buyer</span>
                        <span className="col-span-2">Budget</span>
                        <span className="col-span-3">Preferred Zones</span>
                        <span className="col-span-2">Response</span>
                        <span className="col-span-1">Status</span>
                    </div>

                    {/* Buyer rows */}
                    <div className="divide-y" style={{ borderColor: "#f0ece4" }}>
                        {INSTANT_BUYERS.map((b, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 items-center px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#fafaf8]"
                            >
                                {/* Buyer name + type */}
                                <div className="col-span-4 flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                                        style={{ background: `${NAVY}15`, color: NAVY }}
                                    >
                                        {b.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{b.name}</p>
                                        <p className="text-[10px] text-[#9a8e7a]">{b.type}</p>
                                    </div>
                                </div>

                                {/* Budget */}
                                <div className="col-span-2">
                                    <span className="text-sm font-bold" style={{ color: NAVY }}>{b.budget}</span>
                                </div>

                                {/* Zones */}
                                <div className="col-span-3 flex flex-wrap gap-1">
                                    {b.zones.map((z, zi) => (
                                        <span
                                            key={zi}
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ background: `${GOLD}18`, color: "#7a5f20" }}
                                        >
                                            {z}
                                        </span>
                                    ))}
                                </div>

                                {/* Response time */}
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold" style={{ color: b.responseColor }}>
                                        ⚡ {b.response}
                                    </span>
                                </div>

                                {/* Status badge */}
                                <div className="col-span-1">
                                    <span
                                        className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                        style={{
                                            background: `${b.statusColor}15`,
                                            color:       b.statusColor,
                                            border:     `1px solid ${b.statusColor}30`,
                                        }}
                                    >
                                        {b.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer action */}
                    <div className="mt-4 flex justify-end">
                        <button
                            className="flex items-center gap-1.5 text-xs font-bold tracking-wider transition-opacity hover:opacity-70"
                            style={{ color: NAVY }}
                        >
                            VIEW ALL BUYERS <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}