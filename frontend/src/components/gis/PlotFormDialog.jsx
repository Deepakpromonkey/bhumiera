"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Shapes, X } from "lucide-react";
import { LAND_USE_COLORS, STATUS_COLORS, formatArea } from "@/lib/gis";

const LAND_USE_OPTIONS = Object.keys(LAND_USE_COLORS);
const STATUS_OPTIONS = Object.keys(STATUS_COLORS);
const CLU_OPTIONS = ["Available", "In-Process", "Not Available"];
const FACING_OPTIONS = [
    "North", "South", "East", "West",
    "North-East", "North-West", "South-East", "South-West",
];

function Field({ label, children, wide }) {
    return (
        <div className={wide ? "col-span-2" : ""}>
            <label className="block text-[10px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: "#9a8e7a" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full text-[13px] px-2.5 py-2 rounded-lg border border-[#e0d8c8] bg-white outline-none focus:border-[#c9a84c] transition-colors";

/**
 * Create / edit a plot. Opens straight after a shape is drawn on the map, with
 * the geometry already attached.
 */
export default function PlotFormDialog({ open, geometry, initial, onClose, onSubmit }) {
    const isEdit = !!initial?._id;

    const [values, setValues] = useState({});
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setError("");
        setFiles([]);
        setValues({
            propertyName: initial?.propertyName ?? "",
            plotNumber: initial?.plotNumber ?? "",
            estate: initial?.estate ?? "",
            pocket: initial?.pocket ?? "",
            plotSizeLabel: initial?.plotSizeLabel ?? "",
            landUse: initial?.landUse ?? "",
            status: initial?.status ?? "Available",
            zoneClassification: initial?.zoneClassification ?? "",
            frontFacing: initial?.frontFacing ?? "",
            nearbyRoadName: initial?.nearbyRoadName ?? "",
            roadConnectivity: initial?.roadConnectivity ?? "",
            roadWidthFt: initial?.roadWidthFt ?? "",
            lengthM: initial?.lengthM ?? "",
            widthM: initial?.widthM ?? "",
            ratePerSqFt: initial?.ratePerSqFt ?? "",
            cluAvailability: initial?.cluAvailability ?? "Available",
            ownerName: initial?.ownerName ?? "",
            khasraNo: initial?.khasraNo ?? "",
            notes: initial?.notes ?? "",
        });
    }, [open, initial]);

    if (!open) return null;

    const set = (key) => (event) =>
        setValues((prev) => ({ ...prev, [key]: event.target.value }));

    const isPolygon = !!geometry?.boundary;
    const areaSqm = geometry?.areaSqm;

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!values.propertyName?.trim()) {
            setError("Property name is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await onSubmit({ values, files, geometry });
        } catch (err) {
            setError(err.message || "Could not save the plot.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: "rgba(15,28,46,.55)" }}>
            <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e2d8] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a2d4a" }}>
                            {isPolygon ? <Shapes size={14} className="text-white" /> : <MapPin size={14} className="text-white" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: "#1a2d4a", fontFamily: "Georgia, serif" }}>
                                {isEdit ? "Edit plot" : "New plot on map"}
                            </h2>
                            <p className="text-[11px]" style={{ color: "#9a8e7a" }}>
                                {isPolygon
                                    ? `Traced outline · ${formatArea(areaSqm)}`
                                    : geometry?.location
                                        ? `Pin at ${geometry.location[1].toFixed(5)}, ${geometry.location[0].toFixed(5)}`
                                        : "No geometry attached"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors">
                        <X size={16} style={{ color: "#9a8e7a" }} />
                    </button>
                </div>

                {/* Body */}
                <form id="plot-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                        <Field label="Property name *" wide>
                            <input className={inputCls} value={values.propertyName} onChange={set("propertyName")} autoFocus />
                        </Field>

                        <Field label="Plot number">
                            <input className={inputCls} value={values.plotNumber} onChange={set("plotNumber")} placeholder="e.g. 831" />
                        </Field>
                        <Field label="Plot size label">
                            <input className={inputCls} value={values.plotSizeLabel} onChange={set("plotSizeLabel")} placeholder="e.g. 22.5x45" />
                        </Field>

                        <Field label="Estate">
                            <input className={inputCls} value={values.estate} onChange={set("estate")} placeholder="e.g. IMT Kharkhauda" />
                        </Field>
                        <Field label="Pocket / sector">
                            <input className={inputCls} value={values.pocket} onChange={set("pocket")} placeholder="e.g. Pocket A" />
                        </Field>

                        <Field label="Land use">
                            <select className={inputCls} value={values.landUse} onChange={set("landUse")}>
                                <option value="">—</option>
                                {LAND_USE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </Field>
                        <Field label="Status">
                            <select className={inputCls} value={values.status} onChange={set("status")}>
                                {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </Field>

                        <Field label="Nearby road">
                            <input className={inputCls} value={values.nearbyRoadName} onChange={set("nearbyRoadName")} placeholder="e.g. ROAD 60M WIDE" />
                        </Field>
                        <Field label="Road width (ft)">
                            <input type="number" className={inputCls} value={values.roadWidthFt} onChange={set("roadWidthFt")} />
                        </Field>

                        <Field label="Road connectivity" wide>
                            <input className={inputCls} value={values.roadConnectivity} onChange={set("roadConnectivity")} placeholder="e.g. KMP Expressway, 2 km" />
                        </Field>

                        <Field label="Length (m)">
                            <input type="number" step="any" className={inputCls} value={values.lengthM} onChange={set("lengthM")} />
                        </Field>
                        <Field label="Width (m)">
                            <input type="number" step="any" className={inputCls} value={values.widthM} onChange={set("widthM")} />
                        </Field>

                        <Field label="Rate (₹ / sq ft)">
                            <input type="number" step="any" className={inputCls} value={values.ratePerSqFt} onChange={set("ratePerSqFt")} />
                        </Field>
                        <Field label="CLU availability">
                            <select className={inputCls} value={values.cluAvailability} onChange={set("cluAvailability")}>
                                {CLU_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </Field>

                        <Field label="Zone classification">
                            <input className={inputCls} value={values.zoneClassification} onChange={set("zoneClassification")} />
                        </Field>
                        <Field label="Front facing">
                            <select className={inputCls} value={values.frontFacing} onChange={set("frontFacing")}>
                                <option value="">—</option>
                                {FACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </Field>

                        <Field label="Owner / allottee">
                            <input className={inputCls} value={values.ownerName} onChange={set("ownerName")} />
                        </Field>
                        <Field label="Khasra no.">
                            <input className={inputCls} value={values.khasraNo} onChange={set("khasraNo")} />
                        </Field>

                        <Field label="Notes" wide>
                            <textarea rows={2} className={inputCls} value={values.notes} onChange={set("notes")} />
                        </Field>

                        <Field label="Photos / documents" wide>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                className="w-full text-[12px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#f5f2ed] file:text-[#1a2d4a] hover:file:bg-[#ece7dd]"
                            />
                            {files.length > 0 && (
                                <p className="text-[11px] mt-1" style={{ color: "#9a8e7a" }}>
                                    {files.length} file{files.length === 1 ? "" : "s"} selected
                                </p>
                            )}
                        </Field>
                    </div>

                    {error && (
                        <p className="mt-4 text-[12px] font-semibold text-red-600">{error}</p>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#e8e2d8] shrink-0" style={{ background: "#faf8f4" }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[13px] font-semibold border border-[#e0d8c8] hover:bg-white transition-colors"
                        style={{ color: "#6b6250" }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="plot-form"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold disabled:opacity-60 transition-opacity"
                        style={{ background: "#c9a84c", color: "#1a2d4a" }}
                    >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        {isEdit ? "Save changes" : "Add plot"}
                    </button>
                </div>
            </div>
        </div>
    );
}
