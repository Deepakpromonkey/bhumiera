"use client";

import { useState } from "react";
import {
    Check, Crosshair, Eye, EyeOff, Layers, Loader2, Map as MapIcon,
    Move, Palette, Save, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BASEMAPS, colorTable } from "@/lib/gis";

function Card({ children, className }) {
    return (
        <div
            className={cn(
                "bg-white/95 backdrop-blur border border-[#e8e2d8] rounded-xl shadow-lg overflow-hidden",
                className
            )}
        >
            {children}
        </div>
    );
}

function CardTitle({ icon: Icon, children, right }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#f0ece4]">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9a8e7a" }}>
                <Icon size={11} style={{ color: "#c9a84c" }} />
                {children}
            </span>
            {right}
        </div>
    );
}

/** Basemap picker + colour-by toggle + fit-to-results. */
export function ViewControls({ basemap, setBasemap, colorBy, setColorBy, onZoomToResults }) {
    return (
        <Card className="w-[190px]">
            <CardTitle icon={MapIcon}>Basemap</CardTitle>
            <div className="p-1.5 grid grid-cols-3 gap-1">
                {Object.entries(BASEMAPS).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setBasemap(key)}
                        className={cn(
                            "text-[11px] font-semibold py-1.5 rounded-lg transition-all",
                            basemap === key
                                ? "text-[#1a2d4a]"
                                : "text-[#9a8e7a] hover:bg-[#f5f2ed]"
                        )}
                        style={basemap === key ? { background: "#c9a84c" } : undefined}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            <CardTitle icon={Palette}>Colour by</CardTitle>
            <div className="p-1.5 grid grid-cols-2 gap-1">
                {[
                    ["landUse", "Land use"],
                    ["status", "Status"],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setColorBy(key)}
                        className={cn(
                            "text-[11px] font-semibold py-1.5 rounded-lg transition-all",
                            colorBy === key ? "text-[#1a2d4a]" : "text-[#9a8e7a] hover:bg-[#f5f2ed]"
                        )}
                        style={colorBy === key ? { background: "#c9a84c" } : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <button
                onClick={onZoomToResults}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-[#f0ece4] text-[11px] font-semibold hover:bg-[#f5f2ed] transition-colors"
                style={{ color: "#1a2d4a" }}
            >
                <Crosshair size={11} style={{ color: "#c9a84c" }} />
                Zoom to results
            </button>
        </Card>
    );
}

/** Overlay list: visibility, opacity, rotation and the align/calibrate flow. */
export function LayerControls({
    layers,
    layerState,
    setLayerState,
    alignLayerId,
    setAlignLayerId,
    onSaveAlignment,
    onZoomToLayer,
    saving,
}) {
    const [open, setOpen] = useState(true);

    if (!layers.length) return null;

    const patch = (id, changes) =>
        setLayerState((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));

    return (
        <Card className="w-[250px]">
            <CardTitle
                icon={Layers}
                right={
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="text-[10px] font-bold hover:opacity-70"
                        style={{ color: "#c9a84c" }}
                    >
                        {open ? "HIDE" : "SHOW"}
                    </button>
                }
            >
                Layout plans
            </CardTitle>

            {open && (
                <div className="p-2.5 space-y-3 max-h-[42vh] overflow-y-auto">
                    {layers.map((layer) => {
                        const state = layerState[layer._id] || {};
                        const visible = state.visible ?? layer.visible;
                        const opacity = state.opacity ?? layer.opacity ?? 0.75;
                        const rotation = state.rotationDeg ?? layer.rotationDeg ?? 0;
                        const isAligning = alignLayerId === layer._id;

                        return (
                            <div key={layer._id} className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <button
                                        onClick={() => patch(layer._id, { visible: !visible })}
                                        className="mt-0.5 shrink-0 hover:opacity-70"
                                        title={visible ? "Hide layer" : "Show layer"}
                                    >
                                        {visible
                                            ? <Eye size={13} style={{ color: "#c9a84c" }} />
                                            : <EyeOff size={13} style={{ color: "#b8ab93" }} />}
                                    </button>
                                    <button
                                        onClick={() => onZoomToLayer?.(layer)}
                                        title="Zoom to this layout plan"
                                        className="text-[12px] font-semibold leading-tight text-left hover:underline"
                                        style={{ color: visible ? "#1a2d4a" : "#b8ab93" }}
                                    >
                                        {layer.name}
                                    </button>
                                </div>

                                {visible && (
                                    <div className="pl-5 space-y-2">
                                        <label className="block">
                                            <span className="text-[10px] font-semibold" style={{ color: "#9a8e7a" }}>
                                                Opacity {Math.round(opacity * 100)}%
                                            </span>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.05"
                                                value={opacity}
                                                onChange={(e) => patch(layer._id, { opacity: Number(e.target.value) })}
                                                className="w-full accent-[#c9a84c] h-1"
                                            />
                                        </label>

                                        {isAligning && (
                                            <label className="block">
                                                <span className="text-[10px] font-semibold" style={{ color: "#9a8e7a" }}>
                                                    Rotation {rotation.toFixed(1)}°
                                                </span>
                                                <input
                                                    type="range"
                                                    min="-45" max="45" step="0.5"
                                                    value={rotation}
                                                    onChange={(e) =>
                                                        patch(layer._id, { rotationDeg: Number(e.target.value) })
                                                    }
                                                    className="w-full accent-[#c9a84c] h-1"
                                                />
                                            </label>
                                        )}

                                        {isAligning ? (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] leading-snug" style={{ color: "#9a8e7a" }}>
                                                    Drag the two gold corner handles on the map until the drawing
                                                    lines up with the satellite image.
                                                </p>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => onSaveAlignment(layer._id)}
                                                        disabled={saving}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-60"
                                                        style={{ background: "#c9a84c", color: "#1a2d4a" }}
                                                    >
                                                        {saving
                                                            ? <Loader2 size={11} className="animate-spin" />
                                                            : <Save size={11} />}
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setAlignLayerId(null)}
                                                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-[#e0d8c8] hover:bg-[#f5f2ed]"
                                                        style={{ color: "#6b6250" }}
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAlignLayerId(layer._id)}
                                                className="flex items-center gap-1.5 text-[11px] font-semibold hover:opacity-70"
                                                style={{ color: "#c9a84c" }}
                                            >
                                                <Move size={11} />
                                                Align to map
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

/** Legend driven by what's actually on screen. */
export function Legend({ colorBy, stats }) {
    const table = colorTable(colorBy);
    const buckets = colorBy === "status" ? stats?.byStatus : stats?.byLandUse;
    const counts = Object.fromEntries((buckets || []).map((b) => [b.key, b.count]));

    const rows = Object.entries(table).filter(([key]) => counts[key]);
    const unspecified = counts["Unspecified"];

    if (!rows.length && !unspecified) return null;

    return (
        <Card className="w-[190px]">
            <CardTitle icon={Check}>Legend</CardTitle>
            <div className="p-2.5 space-y-1.5">
                {rows.map(([key, colour]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ background: colour }}
                        />
                        <span className="text-[11px] flex-1 truncate" style={{ color: "#4a4335" }}>{key}</span>
                        <span className="text-[10px] font-bold" style={{ color: "#9a8e7a" }}>{counts[key]}</span>
                    </div>
                ))}
                {unspecified > 0 && (
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ background: "#b8ab93" }}
                        />
                        <span className="text-[11px] flex-1 truncate" style={{ color: "#4a4335" }}>Unspecified</span>
                        <span className="text-[10px] font-bold" style={{ color: "#9a8e7a" }}>{unspecified}</span>
                    </div>
                )}
            </div>
        </Card>
    );
}

/** Draw-mode toolbar. */
export function DrawToolbar({ drawMode, setDrawMode, vertexCount }) {
    const tools = [
        { key: "point", label: "Drop pin", icon: Crosshair },
        { key: "polygon", label: "Trace plot", icon: Move },
    ];

    return (
        <Card>
            <div className="flex items-center gap-1 p-1.5">
                {tools.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setDrawMode(drawMode === key ? "none" : key)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                            drawMode === key ? "text-[#1a2d4a]" : "text-[#6b6250] hover:bg-[#f5f2ed]"
                        )}
                        style={drawMode === key ? { background: "#c9a84c" } : undefined}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                ))}
            </div>

            {drawMode !== "none" && (
                <div className="px-3 py-2 border-t border-[#f0ece4]" style={{ background: "#faf8f4" }}>
                    <p className="text-[10px] leading-snug" style={{ color: "#6b6250" }}>
                        {drawMode === "point" ? (
                            <>Click anywhere on the map to place the plot.</>
                        ) : (
                            <>
                                Click to add corners ({vertexCount} placed). <b>Enter</b> or double-click
                                to finish, <b>Backspace</b> to undo, <b>Esc</b> to cancel.
                            </>
                        )}
                    </p>
                </div>
            )}
        </Card>
    );
}
