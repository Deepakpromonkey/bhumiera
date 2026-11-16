"use client";

import { Crosshair, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import {
    STATUS_COLORS, featureColor, formatArea, formatCoord,
    formatMoney, mediaUrl, totalValue,
} from "@/lib/gis";

function Row({ label, value }) {
    if (value === undefined || value === null || value === "" || value === "—") return null;
    return (
        <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-[#f0ece4] last:border-b-0">
            <span className="text-[11px] shrink-0" style={{ color: "#9a8e7a" }}>{label}</span>
            <span className="text-[12px] font-semibold text-right" style={{ color: "#1a2d4a" }}>{value}</span>
        </div>
    );
}

function Group({ title, children }) {
    const hasContent = Array.isArray(children)
        ? children.some(Boolean)
        : Boolean(children);
    if (!hasContent) return null;

    return (
        <div className="px-4 py-3 border-b border-[#e8e2d8]">
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5" style={{ color: "#c9a84c" }}>
                {title}
            </p>
            {children}
        </div>
    );
}

export default function PlotDetails({ feature, colorBy, onClose, onEdit, onDelete, onZoom, deleting }) {
    if (!feature) return null;

    const p = feature.properties || {};
    const accent = featureColor(p, colorBy);
    const value = totalValue(p);

    return (
        <div className="flex flex-col h-full bg-white border-l border-[#e8e2d8]">
            {/* Header */}
            <div className="shrink-0 border-b border-[#e8e2d8]">
                <div className="h-1" style={{ background: accent }} />
                <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {p.plotNumber && (
                                <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: "#1a2d4a", color: "#fff" }}
                                >
                                    Plot {p.plotNumber}
                                </span>
                            )}
                            {p.status && (
                                <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: `${STATUS_COLORS[p.status] || "#94a3b8"}22`, color: STATUS_COLORS[p.status] || "#64748b" }}
                                >
                                    {p.status}
                                </span>
                            )}
                        </div>
                        <h2
                            className="text-[15px] font-bold mt-1.5 leading-tight break-words"
                            style={{ color: "#1a2d4a", fontFamily: "Georgia, serif" }}
                        >
                            {p.propertyName}
                        </h2>
                        {p.landUse && (
                            <p className="text-[11px] mt-0.5" style={{ color: "#9a8e7a" }}>{p.landUse}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f2ed] shrink-0">
                        <X size={15} style={{ color: "#9a8e7a" }} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                <Group title="Plot">
                    <Row label="Estate" value={p.estate} />
                    <Row label="Pocket" value={p.pocket} />
                    <Row label="Size" value={p.plotSizeLabel} />
                    <Row label="Area" value={formatArea(p.areaSqm)} />
                    <Row
                        label="Dimensions"
                        value={p.lengthM && p.widthM ? `${p.lengthM} × ${p.widthM} m` : null}
                    />
                    <Row label="Zone" value={p.zoneClassification} />
                    <Row label="Shape" value={p.geometryKind === "polygon" ? "Traced outline" : "Pin"} />
                </Group>

                <Group title="Access">
                    <Row label="Nearby road" value={p.nearbyRoadName} />
                    <Row label="Road width" value={p.roadWidthFt ? `${p.roadWidthFt} ft` : null} />
                    <Row label="Connectivity" value={p.roadConnectivity} />
                    <Row label="Facing" value={p.frontFacing} />
                </Group>

                <Group title="Commercials">
                    <Row label="Rate" value={p.ratePerSqFt ? `₹${p.ratePerSqFt.toLocaleString("en-IN")} / sq ft` : null} />
                    <Row label="Indicative value" value={value ? formatMoney(value) : null} />
                    <Row label="CLU" value={p.cluAvailability} />
                </Group>

                <Group title="Record">
                    <Row label="Owner / allottee" value={p.ownerName} />
                    <Row label="Khasra no." value={p.khasraNo} />
                    <Row label="Latitude" value={formatCoord(p.latitude)} />
                    <Row label="Longitude" value={formatCoord(p.longitude)} />
                </Group>

                {p.notes && (
                    <Group title="Notes">
                        <p className="text-[12px] leading-relaxed" style={{ color: "#4a4335" }}>{p.notes}</p>
                    </Group>
                )}

                {!!p.mediaFiles?.length && (
                    <Group title="Media">
                        <div className="grid grid-cols-3 gap-1.5">
                            {p.mediaFiles.map((file) => (
                                <a
                                    key={file}
                                    href={mediaUrl(file)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="aspect-square rounded-lg overflow-hidden border border-[#e8e2d8] bg-[#faf8f4] flex items-center justify-center"
                                >
                                    {/\.(jpe?g|png|webp|gif|avif)$/i.test(file) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={mediaUrl(file)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ExternalLink size={14} style={{ color: "#b8ab93" }} />
                                    )}
                                </a>
                            ))}
                        </div>
                    </Group>
                )}
            </div>

            {/* Actions */}
            <div className="shrink-0 border-t border-[#e8e2d8] p-3 space-y-2" style={{ background: "#faf8f4" }}>
                <div className="flex gap-2">
                    <button
                        onClick={onZoom}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold border border-[#e0d8c8] bg-white hover:bg-[#f5f2ed] transition-colors"
                        style={{ color: "#1a2d4a" }}
                    >
                        <Crosshair size={12} />
                        Zoom to
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-opacity hover:opacity-90"
                        style={{ background: "#c9a84c", color: "#1a2d4a" }}
                    >
                        <Pencil size={12} />
                        Edit
                    </button>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/bhoomi/properties/${p._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold border border-[#e0d8c8] bg-white hover:bg-[#f5f2ed] transition-colors"
                        style={{ color: "#1a2d4a" }}
                    >
                        <ExternalLink size={12} />
                        Full record
                    </Link>
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-3 py-2 rounded-lg text-[12px] font-semibold border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
