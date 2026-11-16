"use client";
import { useEffect, useState } from "react";
import { Bell, LayoutGrid, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function Topbar() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");

    return (
        <header
            className="h-[60px] shrink-0 border-b flex items-center px-6 gap-4"
            style={{ background: "#ffffff", borderColor: "#e8e2d8" }}
        >

            {/* ── Search ── */}
            <div className="relative flex-1 max-w-sm">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#a09080" }}
                />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search properties, leads, or maps..."
                    className="w-full pl-9 pr-4 h-9 text-[13px] rounded-full border outline-none transition-all"
                    style={{
                        background: "#f8f6f2",
                        borderColor: "#e4ddd2",
                        color: "#2a2a2a",
                    }}
                    onFocus={e => e.target.style.borderColor = "#c9a84c"}
                    onBlur={e => e.target.style.borderColor = "#e4ddd2"}
                />
            </div>

            {/* ── Spacer ── */}
            <div className="flex-1" />

            {/* ── Right cluster ── */}
            <div className="flex items-center gap-3 shrink-0">

                {/* Bell */}
                <button
                    className="relative w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[#f0ece4]"
                    style={{ color: "#6b5e3f" }}
                >
                    <Bell size={17} strokeWidth={1.8} />
                    <span
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold text-white rounded-full border-2 border-white"
                        style={{ background: "#c9a84c" }}
                    >
                        3
                    </span>
                </button>

                {/* Grid / apps */}
                <button
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[#f0ece4]"
                    style={{ color: "#6b5e3f" }}
                >
                    <LayoutGrid size={17} strokeWidth={1.8} />
                </button>

                {/* Divider */}
                <div className="w-px h-5" style={{ background: "#e4ddd2" }} />

                {/* User chip */}
                <div className="flex items-center gap-2.5 pl-1">
                    <div className="text-right leading-none">
                        <p className="text-xs font-semibold" style={{ color: "#1a2d4a" }}>
                            {user?.name || "Super Admin"}
                        </p>
                        <p className="text-[10px] font-medium tracking-wide uppercase mt-0.5" style={{ color: "#a09080" }}>
                            {user?.email ? "BHOOMI ERA HQ" : "BHOOMI ERA HQ"}
                        </p>
                    </div>
                    {/* Avatar */}
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 overflow-hidden shrink-0"
                        style={{
                            background: "#1a2d4a",
                            borderColor: "#c9a84c",
                            color: "#c9a84c",
                        }}
                    >
                        {user?.name?.[0]?.toUpperCase() ?? "S"}
                    </div>
                </div>

            </div>
        </header>
    );
}