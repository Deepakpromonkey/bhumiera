"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    MoreVertical, Pencil, Trash2, Eye,
    Loader2, MapPin, Building2,
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "../Datatable";
import { cn } from "@/lib/utils";

const ZONE_COLORS = {
    "Open Space": { bg: "#eaf7ee", text: "#16a34a" },  
    Red:          { bg: "#fff1f0", text: "#ef4444" },  
    White:        { bg: "#f0ece4", text: "#6b5e3f" },  
    Orange:       { bg: "#fff4ea", text: "#ea7a1e" },  
    Others:       { bg: "#eef3fe", text: "#3c80f5" },  
    default:      { bg: "#f0ece4", text: "#6b5e3f" },
};

function ZoneBadge({ zone }) {
    const c = ZONE_COLORS[zone] ?? ZONE_COLORS.default;
    return (
        <span
            className="inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background: c.bg, color: c.text }}
        >
            {zone ?? "—"}
        </span>
    );
}

function CluBadge({ value }) {
    const map = {
        Available:     { bg: "#eaf7ee", text: "#16a34a" },
        "In-Process":  { bg: "#fef9ee", text: "#c9a84c" },
        "Not Available": { bg: "#fff1f0", text: "#ef4444" },
    };
    const c = map[value] ?? { bg: "#f0ece4", text: "#9a8e7a" };
    return (
        <span
            className="inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background: c.bg, color: c.text }}
        >
            {value ?? "—"}
        </span>
    );
}

export function PropertyTable({ data, pagination, onPageChange, onEdit, onDelete }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");

    const columns = useMemo(() => [
        {
            accessorKey: "propertyName",
            header: "Property",
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "#f0ece4" }}
                        >
                            <Building2 size={15} style={{ color: "#1a2d4a" }} />
                        </div>
                        <div>
                            <p className="text-[13.5px] font-semibold" style={{ color: "#1a2d4a" }}>
                                {p.propertyName}
                            </p>
                            {p.nearbyRoadName && (
                                <p className="text-[11px] flex items-center gap-0.5" style={{ color: "#9a8e7a" }}>
                                    <MapPin size={9} /> {p.nearbyRoadName}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "zoneClassification",
            header: "Zone",
            cell: ({ row }) => <ZoneBadge zone={row.original.zoneClassification} />,
        },
        {
            accessorKey: "ratePerSqFt",
            header: "Rate / SqFt",
            cell: ({ row }) => {
                const v = row.original.ratePerSqFt;
                return (
                    <span className="text-[13px] font-semibold" style={{ color: "#1a2d4a" }}>
                        {v ? `₹${v.toLocaleString("en-IN")}` : "—"}
                    </span>
                );
            },
        },
        {
            accessorKey: "cluAvailability",
            header: "CLU Status",
            cell: ({ row }) => <CluBadge value={row.original.cluAvailability} />,
        },
        {
            id: "dimensions",
            header: "Dimensions",
            enableSorting: false,
            cell: ({ row }) => {
                const { lengthM, widthM } = row.original;
                if (!lengthM && !widthM) return <span style={{ color: "#9a8e7a" }}>—</span>;
                return (
                    <span className="text-[13px]" style={{ color: "#6b5e3f" }}>
                        {lengthM ?? "—"}m × {widthM ?? "—"}m
                    </span>
                );
            },
        },
        {
            id: "location",
            header: "GPS",
            enableSorting: false,
            cell: ({ row }) => {
                const { latitude, longitude } = row.original;
                if (!latitude && !longitude) return <span style={{ color: "#9a8e7a" }}>—</span>;
                return (
                    <span className="text-[11px] font-mono" style={{ color: "#6b5e3f" }}>
                        {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                    </span>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Added",
            cell: ({ row }) => {
                const d = row.original.createdAt;
                if (!d) return <span style={{ color: "#9a8e7a" }}>—</span>;
                return (
                    <span className="text-[12px]" style={{ color: "#9a8e7a" }}>
                        {new Date(d).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                        })}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f2ed] transition-colors text-[#9a8e7a] hover:text-[#1a2d4a]">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white border-[#e8e2d8]">
                                <DropdownMenuItem
                                    onClick={() => router.push(`/bhoomi/properties/${p._id}`)}
                                    className="gap-2 text-[13px] cursor-pointer"
                                >
                                    <Eye size={13} /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onEdit(p)}
                                    className="gap-2 text-[13px] cursor-pointer"
                                >
                                    <Pencil size={13} /> Edit
                                </DropdownMenuItem>
                                <div className="h-px bg-[#e8e2d8] my-1" />
                                <DropdownMenuItem
                                    onClick={() => { setDeleteError(""); setDeleteTarget(p); }}
                                    className="gap-2 text-[13px] cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={13} /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [onEdit, router]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                searchPlaceholder="Search properties..."
                serverPagination={pagination}
                onPageChange={onPageChange}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError(""); } }}
            >
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.propertyName}
                            </span>?
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="text-xs text-destructive font-medium px-1 -mt-2">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            disabled={deleting}
                            className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={13} className="animate-spin" /> Deleting...
                                </span>
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}