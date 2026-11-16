"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Users2,
    Map,
    UserCog,
    Settings,
    Plus,
    HelpCircle,
    LogOut,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router   = useRouter();
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const avatarLetter = user?.name?.[0]?.toUpperCase()
        ?? user?.email?.[0]?.toUpperCase()
        ?? "S";

    const NAV_ITEMS = [
        { icon: LayoutDashboard, label: "Dashboard",          href: "/bhoomi/dashboard"  },
        { icon: Building2,       label: "Property Management", href: "/bhoomi/properties" },
        { icon: Users2,          label: "Lead Management",     href: "/bhoomi/leads"      },
        { icon: Map,             label: "GIS/Map",             href: "/bhoomi/gis"        },
        { icon: UserCog,         label: "User Management",     href: "/bhoomi/users"      },
        { icon: Settings,        label: "Settings",            href: "/bhoomi/settings"   },
    ];

    return (
        <aside
            className="w-[185px] shrink-0 flex flex-col h-screen border-r border-[#1e2d3d] relative"
            style={{ background: "#0f1c2e" }}
        >
            {/* ── Logo ── */}
            <div className="flex flex-col px-5 pt-6 pb-5 border-b border-[#1e2d3d] shrink-0">
                <span
                    className="text-white text-xl font-bold leading-tight"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                    Bhoomi Era
                </span>
                <span className="text-[#7a8fa6] text-[10px] font-medium tracking-wide mt-0.5">
                    Super Admin Portal
                </span>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                                isActive
                                    ? "bg-[#c9a84c]/15 text-[#c9a84c] border-l-2 border-[#c9a84c]"
                                    : "text-[#7a8fa6] hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                            )}
                        >
                            <Icon
                                size={15}
                                strokeWidth={isActive ? 2.2 : 1.8}
                                className={isActive ? "text-[#c9a84c]" : "text-[#4a6070]"}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* ── New Property CTA ── */}
            <div className="px-3 pb-4 shrink-0">
                <button
                    onClick={() => router.push("/bhoomi/properties")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold text-[#0f1c2e] transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "#c9a84c" }}
                >
                    <Plus size={15} strokeWidth={2.5} />
                    New Property
                </button>
            </div>

            {/* ── Bottom links ── */}
            <div className="px-3 pb-2 shrink-0 space-y-0.5">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#7a8fa6] hover:bg-white/5 hover:text-white transition-colors">
                    <HelpCircle size={14} strokeWidth={1.8} />
                    Support
                </button>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#7a8fa6] hover:bg-white/5 hover:text-white transition-colors"
                >
                    <LogOut size={14} strokeWidth={1.8} />
                    Sign Out
                </button>
            </div>

            {/* ── Divider ── */}
            <div className="h-px bg-[#1e2d3d] mx-3 mb-2 shrink-0" />

            {/* ── Profile ── */}
            <div className="px-3 py-3 shrink-0 relative">

                {/* Popup */}
                {profileOpen && (
                    <div className="absolute bottom-[72px] left-3 right-3 bg-[#162030] border border-[#1e2d3d] rounded-xl shadow-2xl p-1 z-50">
                        <div className="px-3 py-2 border-b border-[#1e2d3d] mb-1">
                            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-[#7a8fa6] truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => { setProfileOpen(false); router.push("/bhoomi/profile"); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#b0c0d0] hover:bg-white/5 hover:text-white transition-colors"
                        >
                            View Profile
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={13} />
                            Logout
                        </button>
                    </div>
                )}

                {/* Profile row */}
                <button
                    onClick={() => setProfileOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                    {/* Avatar with photo placeholder */}
                    <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center text-sm font-bold text-[#c9a84c] shrink-0">
                        {avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold text-white truncate">{user?.name || "Super Admin"}</p>
                        <p className="text-[10px] text-[#7a8fa6] truncate">{user?.email || "BHOOMI ERA HQ"}</p>
                    </div>
                    {profileOpen
                        ? <ChevronUp size={12} className="text-[#7a8fa6]" />
                        : <ChevronDown size={12} className="text-[#7a8fa6]" />
                    }
                </button>
            </div>

        </aside>
    );
}