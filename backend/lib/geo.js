// Shared geo helpers used by the Property model and the GIS controller.

export const SQM_PER_ACRE = 4046.8564224;
export const SQFT_PER_SQM = 10.763910416709722;

/** Is this a usable [lng, lat] pair? */
export function isValidLngLat(pair) {
  return (
    Array.isArray(pair) &&
    pair.length >= 2 &&
    Number.isFinite(Number(pair[0])) &&
    Number.isFinite(Number(pair[1])) &&
    Math.abs(Number(pair[0])) <= 180 &&
    Math.abs(Number(pair[1])) <= 90
  );
}

/**
 * Close a linear ring (first point must equal last) and drop junk vertices.
 * Returns null when fewer than 3 distinct points survive.
 */
export function normalizeRing(ring) {
  if (!Array.isArray(ring)) return null;

  const cleaned = ring
    .filter(isValidLngLat)
    .map(([lng, lat]) => [Number(lng), Number(lat)]);

  if (cleaned.length < 3) return null;

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    cleaned.push([first[0], first[1]]);
  }

  // A closed ring needs 4 entries minimum (3 corners + repeat of the first).
  return cleaned.length >= 4 ? cleaned : null;
}

/**
 * Area-weighted centroid of a closed ring, in [lng, lat].
 * Falls back to the vertex average for degenerate (zero-area) rings.
 */
export function ringCentroid(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return null;

  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  if (Math.abs(twiceArea) < 1e-12) {
    const pts = ring.slice(0, -1);
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
  }

  const area6 = twiceArea * 3;
  return [x / area6, y / area6];
}

/**
 * Planar area of a closed ring in square metres, using an equirectangular
 * projection around the ring's own latitude. Accurate well past plot scale.
 */
export function ringAreaSqm(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return null;

  const R = 6378137;
  const latRef = (ring.reduce((s, p) => s + p[1], 0) / ring.length) * (Math.PI / 180);
  const mPerDegLng = (Math.PI / 180) * R * Math.cos(latRef);
  const mPerDegLat = (Math.PI / 180) * R;

  let twiceArea = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0] * mPerDegLng;
    const y0 = ring[i][1] * mPerDegLat;
    const x1 = ring[i + 1][0] * mPerDegLng;
    const y1 = ring[i + 1][1] * mPerDegLat;
    twiceArea += x0 * y1 - x1 * y0;
  }

  return Math.abs(twiceArea / 2);
}

/** Parse "minLng,minLat,maxLng,maxLat" into a GeoJSON polygon for $geoWithin. */
export function bboxToPolygon(bbox) {
  if (typeof bbox !== 'string') return null;

  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;

  const [minLng, minLat, maxLng, maxLat] = parts;
  const west = Math.min(minLng, maxLng);
  const east = Math.max(minLng, maxLng);
  const south = Math.min(minLat, maxLat);
  const north = Math.max(minLat, maxLat);

  return {
    type: 'Polygon',
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]],
  };
}

/** Split a repeatable query param ("a,b" or ?x=a&x=b) into a clean array. */
export function toList(value) {
  if (value === undefined || value === null || value === '') return [];

  const raw = Array.isArray(value) ? value : String(value).split(',');

  return raw
    .map((v) => String(v).trim())
    .filter(Boolean);
}

/** Escape user input before it goes into a RegExp. */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
