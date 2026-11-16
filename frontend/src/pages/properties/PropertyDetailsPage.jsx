"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, MapPin, Landmark, BarChart3, Image as ImageIcon,
    ChevronRight, Pencil, Trash2, ArrowLeft, FileText, Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropertyForm } from "@/components/property/PropertyForm";
import { toast } from "@/components/ui/Toast";
import { apiFetch, API_BASE } from "@/lib/api";

const NAVY = "#1a2d4a";
const GOLD = "#c9a84c";
const MUTED = "#9a8e7a";
const BORDER = "#e8e2d8";

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: BORDER }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
                    <Icon size={16} color="white" strokeWidth={2.25} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
                    {title}
                </h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: MUTED }}>
                {label}
            </span>
            <span className="text-sm font-semibold mt-1" style={{ color: NAVY }}>
                {value ?? "—"}
            </span>
        </div>
    );
}

function Pill({ children }) {
    return (
        <span
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border"
            style={{ borderColor: BORDER, background: "#f5f2ed", color: NAVY }}
        >
            {children}
        </span>
    );
}

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function PropertyDetailPage({ params }) {
    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;
    const router = useRouter();

    const [property,   setProperty]   = useState(null);
    const [loading,     setLoading]   = useState(true);
    const [error,       setError]     = useState("");
    const [editOpen,    setEditOpen]  = useState(false);
    const [deleteOpen,  setDeleteOpen] = useState(false);
    const [deleting,    setDeleting]  = useState(false);

    const loadProperty = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const json = await apiFetch(`/api/properties/${id}`);
            setProperty(json?.data ?? null);
        } catch (e) {
            setError(e.message);
            toast.error({ title: "Failed to load property", message: e.message });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { if (id) loadProperty(); }, [id, loadProperty]);

    async function handleSave(formData) {
        await apiFetch(`/api/properties/${id}`, { method: "PUT", body: formData });
        toast.success({ title: "Property updated", message: "Changes saved successfully." });
        setEditOpen(false);
        loadProperty();
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
            toast.success({
                title: "Property deleted",
                message: `"${property.propertyName}" has been removed.`,
            });
            router.push("/bhoomi/properties");
        } catch (e) {
            toast.error({ title: "Failed to delete", message: e.message });
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: `${GOLD} transparent ${GOLD} ${GOLD}` }}
                    />
                    <p className="text-sm font-medium" style={{ color: MUTED }}>
                        Loading property...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                    {error || "Property not found."}
                </p>
                <button
                    onClick={() => router.push("/bhoomi/properties")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border"
                    style={{ borderColor: BORDER, color: NAVY }}
                >
                    <ArrowLeft size={14} /> Back to Property Management
                </button>
            </div>
        );
    }

    const p = property;

    return (
        <div className="min-h-full space-y-5">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1" style={{ color: MUTED }}>
                        <button onClick={() => router.push("/bhoomi/properties")} className="hover:underline">
                            Admin Portal
                        </button>
                        <ChevronRight size={11} />
                        <button onClick={() => router.push("/bhoomi/properties")} className="hover:underline">
                            Property Management
                        </button>
                        <ChevronRight size={11} />
                        <span style={{ color: NAVY, fontWeight: 600 }}>{p.propertyName}</span>
                    </div>
                    <h1 className="text-2xl font-bold leading-tight" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
                        {p.propertyName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Pill>{p.zoneClassification || "Unclassified"}</Pill>
                        <span className="text-xs" style={{ color: MUTED }}>
                            Added {fmtDate(p.createdAt)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/bhoomi/properties")}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold border transition-opacity hover:opacity-80"
                        style={{ borderColor: BORDER, color: NAVY }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: NAVY }}
                    >
                        <Pencil size={14} /> Edit
                    </button>
                    <button
                        onClick={() => setDeleteOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                        style={{ background: GOLD, color: NAVY }}
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-5">
                    <SectionCard icon={Building2} title="Basic Information">
                        <div className="grid grid-cols-2 gap-6">
                            <Field label="Property Name" value={p.propertyName} />
                            <Field label="Zone Classification" value={p.zoneClassification} />
                        </div>
                    </SectionCard>

                    <SectionCard icon={Landmark} title="Technical Specs">
                        <div className="grid grid-cols-2 gap-6">
                            <Field label="Front Facing" value={p.frontFacing} />
                            <Field label="Road Width (ft)" value={p.roadWidthFt} />
                            <Field label="Road Connectivity" value={p.roadConnectivity} />
                            <Field label="Length (m)" value={p.lengthM} />
                            <Field label="Width (m)" value={p.widthM} />
                        </div>
                    </SectionCard>

                    <SectionCard icon={BarChart3} title="Financials & Status">
                        <div className="grid grid-cols-2 gap-6">
                            <Field
                                label="Rate per Sq.Ft (INR)"
                                value={p.ratePerSqFt != null ? `₹ ${Number(p.ratePerSqFt).toLocaleString("en-IN")}` : null}
                            />
                            <Field label="CLU Availability" value={p.cluAvailability} />
                        </div>
                    </SectionCard>
                </div>

                {/* Right column */}
                <div className="space-y-5">
                    <SectionCard icon={MapPin} title="Location Details">
                        <div className="space-y-4">
                            <Field label="Nearby Road Name" value={p.nearbyRoadName} />
                            <div
                                className="h-32 rounded-xl flex flex-col items-center justify-center gap-1"
                                style={{ background: NAVY }}
                            >
                                <MapPin size={20} color={GOLD} />
                                <span className="text-xs" style={{ color: "#b0c0d0" }}>
                                    {p.latitude}, {p.longitude}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Latitude" value={p.latitude} />
                                <Field label="Longitude" value={p.longitude} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard icon={ImageIcon} title="Media & Docs">
                        {p.mediaFiles?.length ? (
                            <div className="grid grid-cols-2 gap-3">
                                {p.mediaFiles.map((file, i) => {
                                    const url = `${API_BASE}/${file}`;
                                    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file);
                                    return (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border rounded-lg overflow-hidden aspect-square flex items-center justify-center"
                                            style={{ borderColor: BORDER }}
                                        >
                                            {isImage ? (
                                                <img src={url} alt={`media-${i}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 p-3">
                                                    <FileText size={20} color={MUTED} />
                                                    <span className="text-[10px]" style={{ color: MUTED }}>
                                                        Document
                                                    </span>
                                                </div>
                                            )}
                                        </a>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm" style={{ color: MUTED }}>
                                No files uploaded for this property.
                            </p>
                        )}
                    </SectionCard>

                    <SectionCard icon={Clock} title="Timeline">
                        <div className="space-y-4">
                            <Field label="Created" value={fmtDate(p.createdAt)} />
                            <Field label="Last Updated" value={fmtDate(p.updatedAt)} />
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* ── Edit modal ── */}
            <Dialog open={editOpen} onOpenChange={(o) => setEditOpen(o)}>
                <DialogContent
                    className="max-w-5xl w-full rounded-2xl bg-[#f5f2ed] p-0 overflow-hidden"
                    style={{ maxHeight: "92vh", overflowY: "auto", width: "80%", maxWidth: "100%" }}
                >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white sticky top-0 z-10" style={{ borderColor: BORDER }}>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1" style={{ color: MUTED }}>
                            <span>Admin Portal</span>
                            <ChevronRight size={11} />
                            <span>Property Management</span>
                            <ChevronRight size={11} />
                            <span style={{ color: NAVY, fontWeight: 600 }}>Edit Property</span>
                        </div>
                        <DialogTitle className="text-xl font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
                            Edit: {p.propertyName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <PropertyForm defaultValues={p} onSave={handleSave} onCancel={() => setEditOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete confirmation ── */}
            <Dialog open={deleteOpen} onOpenChange={(o) => setDeleteOpen(o)}>
                <DialogContent className="max-w-md w-full rounded-2xl bg-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
                            Delete this property?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm mt-2" style={{ color: MUTED }}>
                        This will permanently remove "{p.propertyName}" from the portfolio. This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-6">
                        <button
                            onClick={() => setDeleteOpen(false)}
                            className="px-4 py-2.5 rounded-lg text-sm font-bold border"
                            style={{ borderColor: BORDER, color: NAVY }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                            style={{ background: "#b23b3b" }}
                        >
                            <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Property"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}