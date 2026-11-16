"use client";
import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Loader2, X, FileText, ImageIcon,
    MapPin, Building2, Landmark, BarChart3,
    Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

const schema = z.object({
    propertyName:       z.string().min(2, "Property name is required"),
    zoneClassification: z.string().optional(),
    frontFacing:        z.string().optional(),
    roadWidthFt:        z.coerce.number().min(0).optional().or(z.literal("")),
    roadConnectivity:   z.string().optional(),
    lengthM:            z.coerce.number().min(0).optional().or(z.literal("")),
    widthM:             z.coerce.number().min(0).optional().or(z.literal("")),
    ratePerSqFt:        z.coerce.number().min(0).optional().or(z.literal("")),
    cluAvailability:    z.enum(["Available", "In-Process", "Not Available"]).default("Available"),
    nearbyRoadName:     z.string().optional(),
    latitude:           z.coerce.number().optional().or(z.literal("")),
    longitude:          z.coerce.number().optional().or(z.literal("")),
});

const ZONE_OPTIONS = [
    "Open Space", "Red", "White", "Orange", "Others",
];

const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];

const CLU_OPTIONS = ["Available", "In-Process", "Not Available"];

function FieldErr({ message }) {
    if (!message) return null;
    return (
        <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
            {message}
        </p>
    );
}

function Section({ icon: Icon, title, children }) {
    return (
        <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0ece4]">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#1a2d4a" }}
                >
                    <Icon size={14} className="text-white" />
                </div>
                <h2 className="text-base font-bold" style={{ color: "#1a2d4a", fontFamily: "Georgia, serif" }}>
                    {title}
                </h2>
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
}

function UInput({ label, required, error, prefix, ...props }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold tracking-[0.15em] uppercase"
                   style={{ color: error ? "#b91c1c" : "#9a8e7a" }}>
                {label}{required && " *"}
            </label>
            <div className="relative flex items-center">
                {prefix && (
                    <span className="text-sm mr-1" style={{ color: "#9a8e7a" }}>{prefix}</span>
                )}
                <input
                    {...props}
                    className={cn(
                        "w-full bg-transparent text-sm outline-none border-0 border-b-2 py-2 transition-all",
                        error
                            ? "border-red-400"
                            : "border-[#d4c9b0] focus:border-[#c9a84c]"
                    )}
                    style={{ color: "#1a2d4a" }}
                />
            </div>
            <FieldErr message={error} />
        </div>
    );
}

export function PropertyForm({ defaultValues, onSave, onCancel }) {
    const isEdit     = !!defaultValues;
    const [files,    setFiles]    = useState([]);
    const fileRef    = useRef(null);
    const dv         = defaultValues;

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            propertyName:       dv?.propertyName       ?? "",
            zoneClassification: dv?.zoneClassification ?? "",
            frontFacing:        dv?.frontFacing        ?? "",
            roadWidthFt:        dv?.roadWidthFt        ?? "",
            roadConnectivity:   dv?.roadConnectivity   ?? "",
            lengthM:            dv?.lengthM            ?? "",
            widthM:             dv?.widthM             ?? "",
            ratePerSqFt:        dv?.ratePerSqFt        ?? "",
            cluAvailability:    dv?.cluAvailability    ?? "Available",
            nearbyRoadName:     dv?.nearbyRoadName     ?? "",
            latitude:           dv?.latitude           ?? "",
            longitude:          dv?.longitude          ?? "",
        },
    });

    const lat = watch("latitude");
    const lng = watch("longitude");

    function handleFileAdd(e) {
        const picked = Array.from(e.target.files ?? []);
        const total  = files.length + picked.length;
        if (total > 10) {
            toast.warning({ title: "Too many files", message: "Maximum 10 files allowed." });
            return;
        }
        setFiles(prev => [...prev, ...picked]);
        if (fileRef.current) fileRef.current.value = "";
    }

    function removeFile(i) {
        setFiles(prev => prev.filter((_, idx) => idx !== i));
    }

    async function onSubmit(data) {
        try {
            const fd = new FormData();
            Object.entries(data).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
            });
            files.forEach(f => fd.append("files", f));
            await onSave(fd);
        } catch (e) {
            toast.error({ title: "Save failed", message: e.message ?? "Something went wrong." });
        }
    }

    function onInvalid() {
        const errs = Object.values(errors).map(e => e?.message).filter(Boolean);
        toast.error({
            title:   "Form has errors",
            message: errs.length > 1 ? `${errs.length} fields need attention.` : errs[0],
            duration: 5000,
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── Left + Center (2 cols) ── */}
                <div className="xl:col-span-2 space-y-5">

                    {/* Basic Information */}
                    <Section icon={Building2} title="Basic Information">
                        <UInput
                            label="Property Name"
                            required
                            placeholder="e.g. Skyline Heights Phase 4"
                            error={errors.propertyName?.message}
                            {...register("propertyName")}
                        />

                        {/* Zone Classification */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold tracking-[0.15em] uppercase"
                                   style={{ color: "#9a8e7a" }}>
                                Zone Classification
                            </label>
                            <Controller
                                name="zoneClassification"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {ZONE_OPTIONS.map(z => (
                                            <button
                                                key={z}
                                                type="button"
                                                onClick={() => field.onChange(field.value === z ? "" : z)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                                                style={{
                                                    background:   field.value === z ? "#1a2d4a" : "#f5f2ed",
                                                    color:        field.value === z ? "#fff" : "#6b5e3f",
                                                    borderColor:  field.value === z ? "#1a2d4a" : "#e8e2d8",
                                                }}
                                            >
                                                {z}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>
                    </Section>

                    {/* Technical Specs */}
                    <Section icon={Landmark} title="Technical Specs">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Front Facing */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold tracking-[0.15em] uppercase"
                                       style={{ color: "#9a8e7a" }}>
                                    Front Facing
                                </label>
                                <Controller
                                    name="frontFacing"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {FACING_OPTIONS.map(f => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => field.onChange(field.value === f ? "" : f)}
                                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all"
                                                    style={{
                                                        background:  field.value === f ? "#c9a84c" : "#f5f2ed",
                                                        color:       field.value === f ? "#fff" : "#6b5e3f",
                                                        borderColor: field.value === f ? "#c9a84c" : "#e8e2d8",
                                                    }}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Road Width slider */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold tracking-[0.15em] uppercase"
                                       style={{ color: "#9a8e7a" }}>
                                    Road Width (FT)
                                </label>
                                <Controller
                                    name="roadWidthFt"
                                    control={control}
                                    render={({ field }) => {
                                        const val = Number(field.value) || 0;
                                        return (
                                            <div className="pt-2 space-y-1">
                                                <input
                                                    type="range"
                                                    min={0} max={100} step={1}
                                                    value={val}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="w-full accent-[#c9a84c]"
                                                />
                                                <div className="flex justify-between text-[10px]"
                                                     style={{ color: "#9a8e7a" }}>
                                                    <span>0FT</span>
                                                    <span
                                                        className="font-bold"
                                                        style={{ color: "#c9a84c" }}
                                                    >
                                                        {val}FT (Selected)
                                                    </span>
                                                    <span>100FT</span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <UInput
                                label="Road Connectivity"
                                placeholder="e.g. NH-44 Access Link"
                                {...register("roadConnectivity")}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <UInput
                                    label="Length (M)"
                                    type="number" min={0} step={0.1}
                                    placeholder="0.00"
                                    {...register("lengthM")}
                                />
                                <UInput
                                    label="Width (M)"
                                    type="number" min={0} step={0.1}
                                    placeholder="0.00"
                                    {...register("widthM")}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Financials & Status */}
                    <Section icon={BarChart3} title="Financials & Status">
                        <div className="grid grid-cols-2 gap-4">
                            <UInput
                                label="Rate Per Sq.Ft (INR)"
                                type="number" min={0} step={1}
                                placeholder="0.00"
                                prefix="₹"
                                {...register("ratePerSqFt")}
                            />
                            {/* CLU Availability */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold tracking-[0.15em] uppercase"
                                       style={{ color: "#9a8e7a" }}>
                                    CLU Availability
                                </label>
                                <Controller
                                    name="cluAvailability"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex gap-3 pt-2">
                                            {CLU_OPTIONS.map(opt => (
                                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={field.value === opt}
                                                        onChange={() => field.onChange(opt)}
                                                        className="accent-[#c9a84c]"
                                                    />
                                                    <span className="text-xs font-medium"
                                                          style={{ color: "#1a2d4a" }}>
                                                        {opt}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </Section>
                </div>

                {/* ── Right column ── */}
                <div className="space-y-5">

                    {/* Location Details */}
                    <Section icon={MapPin} title="Location Details">
                        <UInput
                            label="Nearby Road Name"
                            placeholder="Enter landmark road"
                            {...register("nearbyRoadName")}
                        />

                        {/* Map preview */}
                        {lat && lng ? (
                            <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 140 }}>
                                <iframe
                                    title="map"
                                    width="100%"
                                    height="140"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
                                />
                            </div>
                        ) : (
                            <div
                                className="w-full rounded-lg flex flex-col items-center justify-center gap-1"
                                style={{ height: 120, background: "#1a2d4a" }}
                            >
                                <MapPin size={22} style={{ color: "#c9a84c" }} />
                                <p className="text-[11px] text-white/50">Enter coordinates below</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <UInput
                                label="Latitude"
                                type="number"
                                step="0.000001"
                                placeholder="28.6139"
                                {...register("latitude")}
                            />
                            <UInput
                                label="Longitude"
                                type="number"
                                step="0.000001"
                                placeholder="77.2090"
                                {...register("longitude")}
                            />
                        </div>
                        {(lat || lng) && (
                            <p className="text-[10px] text-center font-mono" style={{ color: "#9a8e7a" }}>
                                Latitude: {lat} | Longitude: {lng}
                            </p>
                        )}
                    </Section>

                    {/* Media & Docs */}
                    <Section icon={ImageIcon} title="Media & Docs">
                        {/* Drop zone */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                            style={{ borderColor: "#d4c9b0" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#d4c9b0"}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: "#f0ece4" }}
                            >
                                <Upload size={18} style={{ color: "#c9a84c" }} />
                            </div>
                            <p className="text-sm font-semibold text-center" style={{ color: "#1a2d4a" }}>
                                Drag & drop files here
                            </p>
                            <p className="text-[11px] text-center" style={{ color: "#9a8e7a" }}>
                                PNG, JPG, or PDF (Max 5MB)
                            </p>
                            <button
                                type="button"
                                className="text-xs font-bold underline mt-1 transition-opacity hover:opacity-70"
                                style={{ color: "#c9a84c" }}
                            >
                                Or browse computer
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFileAdd}
                                className="hidden"
                            />
                        </div>

                        {/* Existing media (edit mode) */}
                        {isEdit && (dv?.mediaFiles ?? []).length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold tracking-wider uppercase"
                                   style={{ color: "#9a8e7a" }}>
                                    Existing Files
                                </p>
                                {dv.mediaFiles.map((f, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                                        style={{ borderColor: "#e8e2d8" }}
                                    >
                                        <FileText size={13} style={{ color: "#c9a84c" }} />
                                        <p className="text-xs flex-1 truncate font-medium"
                                           style={{ color: "#1a2d4a" }}>
                                            {f.name ?? f.url?.split("/").pop() ?? `File ${i + 1}`}
                                        </p>
                                        {f.url && (
                                            <a href={f.url} target="_blank" rel="noreferrer"
                                               className="text-[10px] font-bold"
                                               style={{ color: "#c9a84c" }}>
                                                View
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New files queued */}
                        {files.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold tracking-wider uppercase"
                                   style={{ color: "#9a8e7a" }}>
                                    Queued ({files.length}/10)
                                </p>
                                {files.map((f, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                                        style={{ borderColor: "#e8e2d8", background: "#fafaf8" }}
                                    >
                                        <FileText size={13} style={{ color: "#c9a84c" }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate"
                                               style={{ color: "#1a2d4a" }}>
                                                {f.name}
                                            </p>
                                            <p className="text-[10px]" style={{ color: "#9a8e7a" }}>
                                                {(f.size / 1024 / 1024).toFixed(1)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="text-[#9a8e7a] hover:text-red-500 transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Action buttons */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-lg text-sm font-bold tracking-wider text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ background: "#1a2d4a" }}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={15} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Building2 size={15} /> {isEdit ? "Update Property Record" : "Save Property Record"}</>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-lg text-sm font-semibold border transition-colors hover:bg-[#f5f2ed] disabled:opacity-50"
                        style={{ borderColor: "#e8e2d8", color: "#6b5e3f" }}
                    >
                        Cancel & Discard
                    </button>
                </div>

            </div>
        </form>
    );
}