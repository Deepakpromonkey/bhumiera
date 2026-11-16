"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPinned, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import {
    EMPTY_FILTERS, buildQuery, colorTable, formatArea,
} from "@/lib/gis";
import FilterPanel from "@/components/gis/FilterPanel";
import PlotDetails from "@/components/gis/PlotDetails";
import PlotFormDialog from "@/components/gis/PlotFormDialog";
import {
    DrawToolbar, LayerControls, Legend, ViewControls,
} from "@/components/gis/MapControls";

// Leaflet touches window/document on import, so it must never be prerendered.
const MapCanvas = dynamic(() => import("@/components/gis/MapCanvas"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#0b1622" }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "#c9a84c" }} />
        </div>
    ),
});

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };

export default function GISPage() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [features, setFeatures] = useState(EMPTY_COLLECTION);
    const [facets, setFacets] = useState(null);
    const [stats, setStats] = useState(null);
    const [layers, setLayers] = useState([]);
    const [layerState, setLayerState] = useState({});

    const [loading, setLoading] = useState(true);
    const [basemap, setBasemap] = useState("satellite");
    const [colorBy, setColorBy] = useState("landUse");
    const [showFilters, setShowFilters] = useState(true);

    const [selected, setSelected] = useState(null);
    const [drawMode, setDrawMode] = useState("none");
    const [vertexCount, setVertexCount] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingGeometry, setPendingGeometry] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    const [alignLayerId, setAlignLayerId] = useState(null);
    const [savingAlignment, setSavingAlignment] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const mapRef = useRef(null);

    const query = useMemo(() => buildQuery(filters), [filters]);

    // ── Data loading ────────────────────────────────────────────────────────
    const loadMapData = useCallback(async (qs) => {
        setLoading(true);
        try {
            const [geo, statsRes] = await Promise.all([
                apiFetch(`/api/properties/geojson${qs}`),
                apiFetch(`/api/properties/stats${qs}`),
            ]);
            setFeatures(geo ?? EMPTY_COLLECTION);
            setStats(statsRes?.data ?? null);
        } catch (err) {
            toast.error({ title: "Could not load map", message: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadReference = useCallback(async () => {
        try {
            const [facetsRes, layersRes] = await Promise.all([
                apiFetch("/api/properties/facets"),
                apiFetch("/api/map-layers"),
            ]);
            setFacets(facetsRes?.data ?? null);
            setLayers(layersRes?.data ?? []);
        } catch (err) {
            toast.error({ title: "Could not load map layers", message: err.message });
        }
    }, []);

    useEffect(() => { loadReference(); }, [loadReference]);

    // Debounced so typing in the search box doesn't hammer the API.
    useEffect(() => {
        const timer = setTimeout(() => loadMapData(query), 300);
        return () => clearTimeout(timer);
    }, [query, loadMapData]);

    // ── Drawing → form ──────────────────────────────────────────────────────
    const handleDrawComplete = useCallback((result) => {
        setVertexCount(0);

        if (result?.cancelled) {
            setDrawMode("none");
            return;
        }

        setDrawMode("none");
        setEditingRecord(null);
        setPendingGeometry(result);
        setDialogOpen(true);
    }, []);

    // ── Create / update ─────────────────────────────────────────────────────
    const handleSubmit = async ({ values, files, geometry }) => {
        const form = new FormData();

        for (const [key, value] of Object.entries(values)) {
            if (value !== "" && value !== undefined && value !== null) {
                form.append(key, value);
            }
        }

        if (geometry?.boundary) form.append("boundary", JSON.stringify(geometry.boundary));
        if (geometry?.location) form.append("location", JSON.stringify(geometry.location));

        files.forEach((file) => form.append("files", file));

        const editingId = editingRecord?._id;

        const saved = await apiFetch(
            editingId ? `/api/properties/${editingId}` : "/api/properties",
            { method: editingId ? "PUT" : "POST", body: form }
        );

        toast.success({
            title: editingId ? "Plot updated" : "Plot added",
            message: saved?.data?.propertyName ?? values.propertyName,
        });

        setDialogOpen(false);
        setPendingGeometry(null);
        setEditingRecord(null);

        await Promise.all([loadMapData(query), loadReference()]);
    };

    const handleEdit = () => {
        if (!selected) return;
        const props = selected.properties;
        setEditingRecord(props);
        setPendingGeometry({
            boundary: selected.geometry?.type === "Polygon"
                ? selected.geometry.coordinates[0]
                : null,
            location: selected.geometry?.type === "Point"
                ? selected.geometry.coordinates
                : props.centroid,
            areaSqm: props.areaSqm,
        });
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selected) return;
        const props = selected.properties;

        if (!window.confirm(`Delete "${props.propertyName}"? This also removes its files and cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            await apiFetch(`/api/properties/${props._id}`, { method: "DELETE" });
            toast.success({ title: "Plot deleted", message: props.propertyName });
            setSelected(null);
            await loadMapData(query);
        } catch (err) {
            toast.error({ title: "Delete failed", message: err.message });
        } finally {
            setDeleting(false);
        }
    };

    // ── Overlay calibration ─────────────────────────────────────────────────
    const handleSaveAlignment = async (layerId) => {
        const layer = layers.find((l) => l._id === layerId);
        const state = layerState[layerId] || {};
        const bounds = state.bounds || layer?.bounds;
        if (!bounds) return;

        setSavingAlignment(true);
        try {
            const form = new FormData();
            form.append("south", bounds.south);
            form.append("west", bounds.west);
            form.append("north", bounds.north);
            form.append("east", bounds.east);
            form.append("opacity", state.opacity ?? layer.opacity ?? 0.75);
            form.append("rotationDeg", state.rotationDeg ?? layer.rotationDeg ?? 0);

            await apiFetch(`/api/map-layers/${layerId}`, { method: "PUT", body: form });

            toast.success({ title: "Alignment saved", message: layer?.name });
            setAlignLayerId(null);
            await loadReference();
        } catch (err) {
            toast.error({ title: "Could not save alignment", message: err.message });
        } finally {
            setSavingAlignment(false);
        }
    };

    // Corner drags fire continuously; read the target layer from a ref so the
    // callback identity stays stable and never tears down the drag handles.
    const alignLayerIdRef = useRef(null);
    alignLayerIdRef.current = alignLayerId;

    const handleAlignChange = useCallback((bounds) => {
        const layerId = alignLayerIdRef.current;
        if (!layerId) return;

        setLayerState((prev) => ({
            ...prev,
            [layerId]: { ...prev[layerId], bounds },
        }));
    }, []);

    const totals = stats?.totals;

    return (
        <div className="flex flex-col h-full -m-6">
            {/* ── Header strip ── */}
            <div
                className="shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-[#e8e2d8]"
                style={{ background: "#fff" }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className="p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors shrink-0"
                        title={showFilters ? "Hide filters" : "Show filters"}
                    >
                        {showFilters
                            ? <PanelLeftClose size={16} style={{ color: "#9a8e7a" }} />
                            : <PanelLeftOpen size={16} style={{ color: "#9a8e7a" }} />}
                    </button>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1a2d4a" }}>
                        <MapPinned size={15} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-bold leading-tight" style={{ color: "#1a2d4a", fontFamily: "Georgia, serif" }}>
                            GIS / Land Map
                        </h1>
                        <p className="text-[11px]" style={{ color: "#9a8e7a" }}>
                            Plot the estate, trace parcels and filter the portfolio spatially
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                    {[
                        ["Mapped plots", totals?.count ?? 0],
                        ["Total area", formatArea(totals?.totalSqm)],
                        ["Avg rate", totals?.avgRate ? `₹${Math.round(totals.avgRate).toLocaleString("en-IN")}` : "—"],
                    ].map(([label, value]) => (
                        <div key={label} className="text-right">
                            <p className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "#b8ab93" }}>
                                {label}
                            </p>
                            <p className="text-[14px] font-bold" style={{ color: "#1a2d4a" }}>{value}</p>
                        </div>
                    ))}
                    {loading && <Loader2 size={15} className="animate-spin" style={{ color: "#c9a84c" }} />}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex min-h-0">
                {showFilters && (
                    <div className="w-[260px] shrink-0">
                        <FilterPanel
                            filters={filters}
                            setFilters={setFilters}
                            facets={facets}
                            colorTable={colorTable(colorBy)}
                            resultCount={features.features?.length ?? 0}
                        />
                    </div>
                )}

                {/* Map + floating controls */}
                <div className="flex-1 relative min-w-0">
                    <MapCanvas
                        features={features}
                        layers={layers}
                        layerState={layerState}
                        basemap={basemap}
                        colorBy={colorBy}
                        selectedId={selected?.properties?._id ?? null}
                        drawMode={drawMode}
                        alignLayerId={alignLayerId}
                        onSelect={setSelected}
                        onDrawComplete={handleDrawComplete}
                        onDrawProgress={setVertexCount}
                        onAlignChange={handleAlignChange}
                        onMapReady={(map) => { mapRef.current = map; }}
                    />

                    {/* Top-left: draw tools */}
                    <div className="absolute top-3 left-3 z-[1000] w-[290px]">
                        <DrawToolbar
                            drawMode={drawMode}
                            setDrawMode={setDrawMode}
                            vertexCount={vertexCount}
                        />
                    </div>

                    {/* Top-right: view + layers */}
                    <div className="absolute top-3 right-3 z-[1000] space-y-2 flex flex-col items-end">
                        <ViewControls
                            basemap={basemap}
                            setBasemap={setBasemap}
                            colorBy={colorBy}
                            setColorBy={setColorBy}
                            onZoomToResults={() => mapRef.current?.bhoomiFitAll?.()}
                        />
                        <LayerControls
                            layers={layers}
                            layerState={layerState}
                            setLayerState={setLayerState}
                            alignLayerId={alignLayerId}
                            setAlignLayerId={setAlignLayerId}
                            onSaveAlignment={handleSaveAlignment}
                            onZoomToLayer={(layer) =>
                                mapRef.current?.bhoomiFitBounds?.(
                                    layerState[layer._id]?.bounds || layer.bounds
                                )
                            }
                            saving={savingAlignment}
                        />
                    </div>

                    {/* Bottom-left: legend */}
                    <div className="absolute bottom-8 left-3 z-[1000]">
                        <Legend colorBy={colorBy} stats={stats} />
                    </div>
                </div>

                {/* Details drawer */}
                {selected && (
                    <div className="w-[300px] shrink-0">
                        <PlotDetails
                            feature={selected}
                            colorBy={colorBy}
                            deleting={deleting}
                            onClose={() => setSelected(null)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onZoom={() => mapRef.current?.bhoomiFocus?.(selected.properties._id)}
                        />
                    </div>
                )}
            </div>

            <PlotFormDialog
                open={dialogOpen}
                geometry={pendingGeometry}
                initial={editingRecord}
                onClose={() => {
                    setDialogOpen(false);
                    setPendingGeometry(null);
                    setEditingRecord(null);
                }}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
