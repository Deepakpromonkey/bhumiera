import { API_BASE } from "@/lib/api";

/** Free basemaps — no API key, no billing, no usage cap. */
export const BASEMAPS = {
    satellite: {
        label: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
        // Place names / roads drawn on top of the imagery.
        reference:
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    },
    street: {
        label: "Street",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    },
    light: {
        label: "Light",
        url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 20,
    },
};

export const LAND_USE_COLORS = {
    Industrial: "#6366f1",
    Commercial: "#f97316",
    Residential: "#eab308",
    Institutional: "#0d9488",
    "Group Housing": "#db2777",
    "Public Utility": "#64748b",
    "Green Belt": "#16a34a",
    "R&R": "#a16207",
    "Mixed Use": "#8b5cf6",
    Agricultural: "#65a30d",
    Other: "#94a3b8",
};

export const STATUS_COLORS = {
    Available: "#16a34a",
    Reserved: "#f59e0b",
    Allotted: "#2563eb",
    Sold: "#6b7280",
    "Under Litigation": "#dc2626",
    "Not For Sale": "#475569",
};

export const UNSPECIFIED_COLOR = "#b8ab93";

/** Colour a feature by whichever attribute the user is theming the map on. */
export function featureColor(props = {}, colorBy = "landUse") {
    const table = colorBy === "status" ? STATUS_COLORS : LAND_USE_COLORS;
    return table[props[colorBy]] || UNSPECIFIED_COLOR;
}

export function colorTable(colorBy) {
    return colorBy === "status" ? STATUS_COLORS : LAND_USE_COLORS;
}

/** Resolve an /uploads/... path from the API into an absolute URL. */
export function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_BASE}/${String(path).replace(/^\.?\//, "")}`;
}

/** Turn the filter state into the query string the GIS endpoints expect. */
export function buildQuery(filters = {}) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "") continue;
        if (Array.isArray(value)) {
            if (value.length) params.set(key, value.join(","));
        } else {
            params.set(key, String(value));
        }
    }

    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

export const EMPTY_FILTERS = {
    q: "",
    landUse: [],
    status: [],
    zoneClassification: [],
    cluAvailability: [],
    frontFacing: [],
    estate: [],
    roadName: "",
    minRoadWidth: "",
    maxRoadWidth: "",
    minRate: "",
    maxRate: "",
    minArea: "",
    maxArea: "",
};

/** How many filters are actually narrowing the result set right now. */
export function activeFilterCount(filters) {
    return Object.entries(filters).reduce((n, [key, value]) => {
        if (key === "q") return n + (value ? 1 : 0);
        if (Array.isArray(value)) return n + (value.length ? 1 : 0);
        return n + (value === "" || value === undefined ? 0 : 1);
    }, 0);
}

const SQFT_PER_SQM = 10.763910416709722;

export function formatArea(sqm) {
    if (!Number.isFinite(sqm)) return "—";
    const acres = sqm / 4046.8564224;
    if (acres >= 0.1) return `${acres.toFixed(2)} ac`;
    return `${Math.round(sqm).toLocaleString("en-IN")} m²`;
}

export function formatMoney(value) {
    if (!Number.isFinite(value)) return "—";
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Indicative total value: rate is per sq ft, area is stored in sq m. */
export function totalValue(props = {}) {
    const { ratePerSqFt, areaSqm } = props;
    if (!Number.isFinite(ratePerSqFt) || !Number.isFinite(areaSqm)) return null;
    return ratePerSqFt * areaSqm * SQFT_PER_SQM;
}

export function formatCoord(value) {
    return Number.isFinite(value) ? value.toFixed(6) : "—";
}
