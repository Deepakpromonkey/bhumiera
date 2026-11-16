"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BASEMAPS, featureColor, mediaUrl } from "@/lib/gis";

// Roughly the IMT Kharkhauda estate, used until real data defines the extent.
const DEFAULT_CENTER = [28.88, 76.915];
const DEFAULT_ZOOM = 14;

const SELECTED_COLOR = "#c9a84c";

/**
 * The Leaflet surface. Deliberately imperative: every concern below owns one
 * effect and one set of refs, so React re-renders never rebuild the map.
 *
 * Loaded via next/dynamic with { ssr: false } — Leaflet needs a real DOM.
 */
export default function MapCanvas({
    features,
    layers = [],
    layerState = {},
    basemap = "satellite",
    colorBy = "landUse",
    selectedId = null,
    drawMode = "none",
    alignLayerId = null,
    onSelect,
    onDrawComplete,
    onDrawProgress,
    onAlignChange,
    onMapReady,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    const baseLayerRef = useRef(null);
    const refLayerRef = useRef(null);
    const overlaysRef = useRef(new Map());   // layerId -> { overlay, paneName }
    const featureLayerRef = useRef(null);
    const featureIndexRef = useRef(new Map()); // propertyId -> leaflet layer
    const didFitRef = useRef(false);

    const drawRef = useRef({ points: [], markers: [], line: null, rubber: null });
    const alignRef = useRef({ markers: [], rect: null });

    // Latest callbacks, so the map's own listeners never capture stale props.
    const cbRef = useRef({});
    cbRef.current = { onSelect, onDrawComplete, onDrawProgress, onAlignChange };

    const modeRef = useRef(drawMode);
    modeRef.current = drawMode;

    // ── Map init (once) ─────────────────────────────────────────────────────
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;

        const map = L.map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: true,
            preferCanvas: true,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

        mapRef.current = map;
        onMapReady?.(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Basemap ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const config = BASEMAPS[basemap] || BASEMAPS.satellite;

        if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
        if (refLayerRef.current) {
            map.removeLayer(refLayerRef.current);
            refLayerRef.current = null;
        }

        baseLayerRef.current = L.tileLayer(config.url, {
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            // Let users zoom past the imagery rather than hitting a wall.
            maxNativeZoom: config.maxZoom,
        }).addTo(map);

        baseLayerRef.current.setZIndex(100);

        if (config.reference) {
            refLayerRef.current = L.tileLayer(config.reference, {
                maxZoom: config.maxZoom,
                maxNativeZoom: config.maxZoom,
            }).addTo(map);
            refLayerRef.current.setZIndex(150);
        }
    }, [basemap]);

    // ── Georeferenced image overlays ────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const ordered = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const seen = new Set();

        ordered.forEach((layer, index) => {
            const id = layer._id;
            const state = layerState[id] || {};
            const bounds = state.bounds || layer.bounds;
            const visible = state.visible ?? layer.visible;
            const opacity = state.opacity ?? layer.opacity ?? 0.75;
            const rotation = state.rotationDeg ?? layer.rotationDeg ?? 0;

            const usable =
                layer.kind === "imageOverlay" &&
                layer.imageUrl &&
                bounds &&
                ["south", "west", "north", "east"].every((k) => Number.isFinite(bounds[k]));

            if (!usable || !visible) return;
            seen.add(id);

            // Overlays sit below plots (default overlayPane is 400) so drawn
            // properties always stay readable on top of the drawing.
            const paneName = `bhoomi-overlay-${id}`;
            if (!map.getPane(paneName)) {
                const pane = map.createPane(paneName);
                pane.style.zIndex = String(300 + index * 5);
                pane.style.pointerEvents = "none";
            }

            const latLngBounds = L.latLngBounds(
                [bounds.south, bounds.west],
                [bounds.north, bounds.east]
            );

            let entry = overlaysRef.current.get(id);

            if (!entry) {
                const overlay = L.imageOverlay(mediaUrl(layer.imageUrl), latLngBounds, {
                    pane: paneName,
                    opacity,
                    interactive: false,
                }).addTo(map);

                entry = { overlay, paneName };
                overlaysRef.current.set(id, entry);
            } else {
                entry.overlay.setBounds(latLngBounds);
                entry.overlay.setOpacity(opacity);
            }

            // Leaflet's ImageOverlay is axis-aligned. Rotating the *pane*
            // rather than the image keeps Leaflet's own positioning transform
            // on the <img> intact.
            const pane = map.getPane(paneName);
            const applyRotation = () => {
                if (!rotation) {
                    pane.style.transform = "";
                    return;
                }
                const centre = map.latLngToLayerPoint(latLngBounds.getCenter());
                pane.style.transformOrigin = `${centre.x}px ${centre.y}px`;
                pane.style.transform = `rotate(${rotation}deg)`;
            };

            applyRotation();

            // The pane's origin shifts on zoom, so recompute then. Detach the
            // previous closure by reference — passing an undefined handler to
            // off() would remove every zoomend listener on the map.
            if (entry.applyRotation) map.off("zoomend viewreset", entry.applyRotation);
            entry.applyRotation = applyRotation;
            map.on("zoomend viewreset", applyRotation);
        });

        // Drop overlays that were hidden or deleted.
        for (const [id, entry] of overlaysRef.current.entries()) {
            if (seen.has(id)) continue;
            map.removeLayer(entry.overlay);
            if (entry.applyRotation) map.off("zoomend viewreset", entry.applyRotation);
            overlaysRef.current.delete(id);
        }
    }, [layers, layerState]);

    // ── Property features ───────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (featureLayerRef.current) {
            map.removeLayer(featureLayerRef.current);
            featureLayerRef.current = null;
        }
        featureIndexRef.current.clear();

        if (!features?.features?.length) return;

        const styleFor = (feature) => {
            const colour = featureColor(feature.properties, colorBy);
            return {
                color: colour,
                weight: 2,
                opacity: 0.95,
                fillColor: colour,
                fillOpacity: 0.35,
            };
        };

        const geoLayer = L.geoJSON(features, {
            style: styleFor,
            pointToLayer: (feature, latlng) =>
                L.circleMarker(latlng, { radius: 7, ...styleFor(feature), fillOpacity: 0.85 }),
            onEachFeature: (feature, layer) => {
                const id = feature.properties?._id;
                if (id) featureIndexRef.current.set(id, layer);

                const label = feature.properties?.plotNumber
                    ? `${feature.properties.plotNumber} · ${feature.properties.propertyName ?? ""}`
                    : feature.properties?.propertyName ?? "Property";

                layer.bindTooltip(label, { direction: "top", sticky: true, opacity: 0.95 });

                layer.on("click", (event) => {
                    // While drawing, clicks belong to the sketch, not selection.
                    if (modeRef.current !== "none") return;
                    L.DomEvent.stopPropagation(event);
                    cbRef.current.onSelect?.(feature);
                });
            },
        }).addTo(map);

        featureLayerRef.current = geoLayer;

        if (!didFitRef.current) {
            const bounds = geoLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
                didFitRef.current = true;
            }
        }
    }, [features, colorBy]);

    // ── Selection highlight ─────────────────────────────────────────────────
    useEffect(() => {
        const layer = featureLayerRef.current;
        if (!layer) return;

        layer.eachLayer((child) => {
            const props = child.feature?.properties;
            if (!props) return;
            const colour = featureColor(props, colorBy);
            const isSelected = props._id === selectedId;

            child.setStyle({
                color: isSelected ? SELECTED_COLOR : colour,
                weight: isSelected ? 4 : 2,
                fillOpacity: isSelected ? 0.55 : child instanceof L.CircleMarker ? 0.85 : 0.35,
            });

            if (isSelected) {
                child.bringToFront();
                if (child instanceof L.CircleMarker) child.setRadius(10);
            } else if (child instanceof L.CircleMarker) {
                child.setRadius(7);
            }
        });
    }, [selectedId, colorBy, features]);

    // ── Drawing ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const clearSketch = () => {
            const sketch = drawRef.current;
            sketch.markers.forEach((m) => map.removeLayer(m));
            if (sketch.line) map.removeLayer(sketch.line);
            if (sketch.rubber) map.removeLayer(sketch.rubber);
            drawRef.current = { points: [], markers: [], line: null, rubber: null };
            cbRef.current.onDrawProgress?.(0);
        };

        clearSketch();

        if (drawMode === "none") {
            map.getContainer().style.cursor = "";
            map.doubleClickZoom.enable();
            return;
        }

        map.getContainer().style.cursor = "crosshair";
        if (drawMode === "polygon") map.doubleClickZoom.disable();

        const finishPolygon = () => {
            const ring = drawRef.current.points.map((p) => [p.lng, p.lat]);
            if (ring.length < 3) return;
            clearSketch();
            cbRef.current.onDrawComplete?.({ boundary: ring });
        };

        const handleClick = (event) => {
            if (drawMode === "point") {
                const { lat, lng } = event.latlng;
                cbRef.current.onDrawComplete?.({ location: [lng, lat] });
                return;
            }

            const sketch = drawRef.current;

            // Clicking the first vertex again closes the ring.
            if (sketch.points.length >= 3) {
                const firstPx = map.latLngToContainerPoint(sketch.points[0]);
                const clickPx = map.latLngToContainerPoint(event.latlng);
                if (firstPx.distanceTo(clickPx) < 12) {
                    finishPolygon();
                    return;
                }
            }

            sketch.points.push(event.latlng);

            const marker = L.circleMarker(event.latlng, {
                radius: 5,
                color: "#ffffff",
                weight: 2,
                fillColor: SELECTED_COLOR,
                fillOpacity: 1,
            }).addTo(map);
            sketch.markers.push(marker);

            if (sketch.line) map.removeLayer(sketch.line);
            sketch.line = L.polygon(sketch.points, {
                color: SELECTED_COLOR,
                weight: 2,
                dashArray: "6 4",
                fillColor: SELECTED_COLOR,
                fillOpacity: 0.2,
            }).addTo(map);

            cbRef.current.onDrawProgress?.(sketch.points.length);
        };

        const handleMouseMove = (event) => {
            if (drawMode !== "polygon") return;
            const sketch = drawRef.current;
            if (!sketch.points.length) return;

            const last = sketch.points[sketch.points.length - 1];
            if (sketch.rubber) map.removeLayer(sketch.rubber);
            sketch.rubber = L.polyline([last, event.latlng], {
                color: SELECTED_COLOR,
                weight: 1.5,
                dashArray: "4 4",
                opacity: 0.8,
            }).addTo(map);
        };

        const handleKey = (event) => {
            if (event.key === "Enter") finishPolygon();
            if (event.key === "Escape") {
                clearSketch();
                cbRef.current.onDrawComplete?.({ cancelled: true });
            }
            if (event.key === "Backspace") {
                event.preventDefault();
                const sketch = drawRef.current;
                if (!sketch.points.length) return;
                sketch.points.pop();
                const marker = sketch.markers.pop();
                if (marker) map.removeLayer(marker);
                if (sketch.line) map.removeLayer(sketch.line);
                sketch.line = sketch.points.length
                    ? L.polygon(sketch.points, {
                          color: SELECTED_COLOR,
                          weight: 2,
                          dashArray: "6 4",
                          fillColor: SELECTED_COLOR,
                          fillOpacity: 0.2,
                      }).addTo(map)
                    : null;
                cbRef.current.onDrawProgress?.(sketch.points.length);
            }
        };

        map.on("click", handleClick);
        map.on("mousemove", handleMouseMove);
        map.on("dblclick", finishPolygon);
        window.addEventListener("keydown", handleKey);

        return () => {
            map.off("click", handleClick);
            map.off("mousemove", handleMouseMove);
            map.off("dblclick", finishPolygon);
            window.removeEventListener("keydown", handleKey);
            map.getContainer().style.cursor = "";
            map.doubleClickZoom.enable();
            clearSketch();
        };
    }, [drawMode]);

    // ── Align mode: drag the overlay's corners onto the imagery ─────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const teardown = () => {
            alignRef.current.markers.forEach((m) => map.removeLayer(m));
            if (alignRef.current.rect) map.removeLayer(alignRef.current.rect);
            alignRef.current = { markers: [], rect: null };
        };

        teardown();

        if (!alignLayerId) return;

        const layer = layers.find((l) => l._id === alignLayerId);
        const bounds = layerState[alignLayerId]?.bounds || layer?.bounds;
        if (!bounds) return;

        const current = {
            south: bounds.south,
            west: bounds.west,
            north: bounds.north,
            east: bounds.east,
        };

        const rect = L.rectangle(
            [
                [current.south, current.west],
                [current.north, current.east],
            ],
            { color: SELECTED_COLOR, weight: 2, dashArray: "8 5", fill: false }
        ).addTo(map);

        const handleIcon = L.divIcon({
            className: "",
            html: `<div style="width:16px;height:16px;border-radius:50%;background:#c9a84c;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);cursor:move"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });

        const swMarker = L.marker([current.south, current.west], {
            draggable: true,
            icon: handleIcon,
            zIndexOffset: 1000,
        }).addTo(map);

        const neMarker = L.marker([current.north, current.east], {
            draggable: true,
            icon: handleIcon,
            zIndexOffset: 1000,
        }).addTo(map);

        swMarker.bindTooltip("South-west corner", { direction: "left" });
        neMarker.bindTooltip("North-east corner", { direction: "right" });

        const push = () => {
            const sw = swMarker.getLatLng();
            const ne = neMarker.getLatLng();
            const next = {
                south: Math.min(sw.lat, ne.lat),
                north: Math.max(sw.lat, ne.lat),
                west: Math.min(sw.lng, ne.lng),
                east: Math.max(sw.lng, ne.lng),
            };
            rect.setBounds([
                [next.south, next.west],
                [next.north, next.east],
            ]);
            cbRef.current.onAlignChange?.(next);
        };

        swMarker.on("drag", push);
        neMarker.on("drag", push);

        alignRef.current = { markers: [swMarker, neMarker], rect };

        return teardown;
        // layerState is intentionally excluded: re-running on every drag would
        // tear the handles out from under the pointer.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alignLayerId, layers]);

    // ── Imperative helpers for the parent ───────────────────────────────────
    useEffect(() => {
        if (!onMapReady || !mapRef.current) return;
        const map = mapRef.current;

        map.bhoomiFocus = (id) => {
            const layer = featureIndexRef.current.get(id);
            if (!layer) return;
            if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 18 });
            else if (layer.getLatLng) map.setView(layer.getLatLng(), Math.max(map.getZoom(), 17));
        };

        // Frame everything currently passing the filters.
        map.bhoomiFitAll = () => {
            const geoLayer = featureLayerRef.current;
            if (!geoLayer) return;
            const bounds = geoLayer.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        };

        // Frame a layout plan, so an overlay is never lost off-screen.
        map.bhoomiFitBounds = (b) => {
            if (!b || !["south", "west", "north", "east"].every((k) => Number.isFinite(b[k]))) return;
            map.fitBounds([[b.south, b.west], [b.north, b.east]], { padding: [30, 30] });
        };
    }, [onMapReady, features]);

    return <div ref={containerRef} className="w-full h-full" style={{ background: "#0b1622" }} />;
}
