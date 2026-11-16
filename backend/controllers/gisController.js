import Property, { LAND_USE_OPTIONS, STATUS_OPTIONS } from '../models/Property.js';
import { bboxToPolygon, escapeRegex, toList } from '../lib/geo.js';

/** Fields exposed on every GeoJSON feature and in the map's result list. */
const FEATURE_FIELDS = [
  'propertyName',
  'plotNumber',
  'estate',
  'pocket',
  'plotSizeLabel',
  'landUse',
  'status',
  'zoneClassification',
  'cluAvailability',
  'frontFacing',
  'roadWidthFt',
  'roadConnectivity',
  'nearbyRoadName',
  'lengthM',
  'widthM',
  'areaSqm',
  'areaAcres',
  'ratePerSqFt',
  'ownerName',
  'khasraNo',
  'notes',
  'mediaFiles',
  'latitude',
  'longitude',
  'createdAt',
  'updatedAt',
];

function addRange(filter, field, min, max) {
  const lo = Number(min);
  const hi = Number(max);
  const range = {};

  if (Number.isFinite(lo)) range.$gte = lo;
  if (Number.isFinite(hi)) range.$lte = hi;

  if (Object.keys(range).length) filter[field] = range;
}

/**
 * Translate query-string filters into a Mongo filter document.
 * Shared by the map, the list endpoint and the stats endpoint so all three
 * always agree on what "the current selection" means.
 */
export function buildPropertyFilter(query = {}) {
  const filter = {};
  const and = [];

  // ── Free-text search ────────────────────────────────────────────────────
  const q = (query.q || query.search || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    and.push({
      $or: [
        { propertyName: rx },
        { plotNumber: rx },
        { nearbyRoadName: rx },
        { roadConnectivity: rx },
        { ownerName: rx },
        { khasraNo: rx },
        { estate: rx },
        { pocket: rx },
        { plotSizeLabel: rx },
      ],
    });
  }

  // ── Multi-select facets ─────────────────────────────────────────────────
  const facets = {
    landUse: toList(query.landUse),
    status: toList(query.status),
    zoneClassification: toList(query.zoneClassification),
    cluAvailability: toList(query.cluAvailability),
    frontFacing: toList(query.frontFacing),
    estate: toList(query.estate),
    pocket: toList(query.pocket),
    plotSizeLabel: toList(query.plotSizeLabel),
  };

  for (const [field, values] of Object.entries(facets)) {
    if (values.length) filter[field] = { $in: values };
  }

  // ── Road-based filtering ────────────────────────────────────────────────
  // "Show me everything on / near this road" — the primary way plots are
  // located on a layout plan.
  const roadName = (query.roadName || query.road || '').trim();
  if (roadName) {
    const rx = new RegExp(escapeRegex(roadName), 'i');
    and.push({ $or: [{ nearbyRoadName: rx }, { roadConnectivity: rx }] });
  }

  addRange(filter, 'roadWidthFt', query.minRoadWidth, query.maxRoadWidth);
  addRange(filter, 'ratePerSqFt', query.minRate, query.maxRate);
  addRange(filter, 'areaSqm', query.minArea, query.maxArea);
  addRange(filter, 'areaAcres', query.minAcres, query.maxAcres);

  // Total-price range, derived from rate × area rather than stored.
  const minTotal = Number(query.minTotal);
  const maxTotal = Number(query.maxTotal);
  if (Number.isFinite(minTotal) || Number.isFinite(maxTotal)) {
    const expr = [];
    const totalExpr = {
      $multiply: [
        { $ifNull: ['$ratePerSqFt', 0] },
        { $multiply: [{ $ifNull: ['$areaSqm', 0] }, 10.763910416709722] },
      ],
    };
    if (Number.isFinite(minTotal)) expr.push({ $gte: [totalExpr, minTotal] });
    if (Number.isFinite(maxTotal)) expr.push({ $lte: [totalExpr, maxTotal] });
    and.push({ $expr: { $and: expr } });
  }

  // ── Geometry presence ───────────────────────────────────────────────────
  if (query.hasGeometry === 'true') {
    and.push({ $or: [{ location: { $ne: null } }, { boundary: { $ne: null } }] });
  } else if (query.hasGeometry === 'false') {
    and.push({ location: null, boundary: null });
  }

  if (query.geometryKind === 'polygon') and.push({ boundary: { $ne: null } });
  if (query.geometryKind === 'point') and.push({ boundary: null, location: { $ne: null } });

  // ── Spatial filters ─────────────────────────────────────────────────────
  // Viewport / bounding-box query, so the map only pulls what's on screen.
  const bboxPolygon = bboxToPolygon(query.bbox);
  if (bboxPolygon) {
    and.push({
      $or: [
        { location: { $geoWithin: { $geometry: bboxPolygon } } },
        { boundary: { $geoWithin: { $geometry: bboxPolygon } } },
      ],
    });
  }

  // Radius query: near=lng,lat&radius=metres
  const near = toList(query.near).map(Number);
  const radius = Number(query.radius);
  if (near.length === 2 && near.every(Number.isFinite) && Number.isFinite(radius)) {
    and.push({
      location: {
        $geoWithin: { $centerSphere: [[near[0], near[1]], radius / 6378137] },
      },
    });
  }

  // Arbitrary polygon query: polygon=lng,lat,lng,lat,...
  const polygonPts = toList(query.polygon).map(Number);
  if (polygonPts.length >= 8 && polygonPts.length % 2 === 0 && polygonPts.every(Number.isFinite)) {
    const ring = [];
    for (let i = 0; i < polygonPts.length; i += 2) ring.push([polygonPts[i], polygonPts[i + 1]]);

    const [fx, fy] = ring[0];
    const [lx, ly] = ring[ring.length - 1];
    if (fx !== lx || fy !== ly) ring.push([fx, fy]);

    if (ring.length >= 4) {
      const geometry = { type: 'Polygon', coordinates: [ring] };
      and.push({
        $or: [
          { location: { $geoWithin: { $geometry: geometry } } },
          { boundary: { $geoWithin: { $geometry: geometry } } },
        ],
      });
    }
  }

  if (and.length) filter.$and = and;

  return filter;
}

/** Shape one property document as a GeoJSON Feature. */
function toFeature(doc) {
  const props = {};
  for (const key of FEATURE_FIELDS) {
    if (doc[key] !== undefined && doc[key] !== null) props[key] = doc[key];
  }

  const geometry = doc.boundary?.coordinates?.length
    ? { type: 'Polygon', coordinates: doc.boundary.coordinates }
    : doc.location?.coordinates?.length
      ? { type: 'Point', coordinates: doc.location.coordinates }
      : null;

  return {
    type: 'Feature',
    id: String(doc._id),
    geometry,
    properties: {
      ...props,
      _id: String(doc._id),
      geometryKind: doc.boundary?.coordinates?.length ? 'polygon' : 'point',
      // Kept alongside the polygon so the map can label / cluster without
      // recomputing a centroid client-side.
      centroid: doc.location?.coordinates || null,
    },
  };
}

/**
 * GET /api/properties/geojson
 * Every mapped property matching the current filters, as a FeatureCollection.
 */
export const getPropertiesGeoJSON = async (req, res) => {
  try {
    const filter = buildPropertyFilter(req.query);

    // Only geometry-bearing records belong on the map.
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ location: { $ne: null } }, { boundary: { $ne: null } }] },
    ];

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5000, 1), 20000);

    const docs = await Property.find(filter).limit(limit).lean();

    res.status(200).json({
      type: 'FeatureCollection',
      count: docs.length,
      limit,
      truncated: docs.length === limit,
      features: docs.map(toFeature),
    });
  } catch (error) {
    console.error('Error building properties GeoJSON:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error building map data',
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/facets
 * Distinct values and numeric ranges, so filter controls can populate
 * themselves from real data instead of hard-coded lists.
 */
export const getPropertyFacets = async (req, res) => {
  try {
    const [distinct, ranges, counts] = await Promise.all([
      Promise.all(
        ['landUse', 'status', 'zoneClassification', 'cluAvailability', 'frontFacing',
          'estate', 'pocket', 'plotSizeLabel', 'nearbyRoadName'
        ].map(async (field) => [field, (await Property.distinct(field)).filter(Boolean).sort()])
      ),
      Property.aggregate([
        {
          $group: {
            _id: null,
            minRate: { $min: '$ratePerSqFt' },
            maxRate: { $max: '$ratePerSqFt' },
            minArea: { $min: '$areaSqm' },
            maxArea: { $max: '$areaSqm' },
            minRoadWidth: { $min: '$roadWidthFt' },
            maxRoadWidth: { $max: '$roadWidthFt' },
          },
        },
      ]),
      Property.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            mapped: {
              $sum: {
                $cond: [
                  { $or: [{ $ne: ['$location', null] }, { $ne: ['$boundary', null] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const { _id, ...range } = ranges[0] || {};
    const { _id: __, ...totals } = counts[0] || {};

    res.status(200).json({
      success: true,
      data: {
        ...Object.fromEntries(distinct),
        // Full option lists, so the UI can offer values not yet in the data.
        landUseOptions: LAND_USE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        range,
        totals: { total: 0, mapped: 0, ...totals },
      },
    });
  } catch (error) {
    console.error('Error building property facets:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error building filters',
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/stats
 * Counts grouped by land use and status for the map legend / summary strip.
 */
export const getPropertyStats = async (req, res) => {
  try {
    const filter = buildPropertyFilter(req.query);

    const [byLandUse, byStatus, summary] = await Promise.all([
      Property.aggregate([
        { $match: filter },
        { $group: { _id: '$landUse', count: { $sum: 1 }, acres: { $sum: '$areaAcres' } } },
        { $sort: { count: -1 } },
      ]),
      Property.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, acres: { $sum: '$areaAcres' } } },
        { $sort: { count: -1 } },
      ]),
      Property.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAcres: { $sum: '$areaAcres' },
            totalSqm: { $sum: '$areaSqm' },
            avgRate: { $avg: '$ratePerSqFt' },
          },
        },
      ]),
    ]);

    const { _id, ...totals } = summary[0] || {};

    res.status(200).json({
      success: true,
      data: {
        byLandUse: byLandUse.map(({ _id: k, ...rest }) => ({ key: k || 'Unspecified', ...rest })),
        byStatus: byStatus.map(({ _id: k, ...rest }) => ({ key: k || 'Unspecified', ...rest })),
        totals: { count: 0, totalAcres: 0, totalSqm: 0, avgRate: null, ...totals },
      },
    });
  } catch (error) {
    console.error('Error building property stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error building stats',
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/near?lng=&lat=&radius=
 * Nearest mapped properties to a clicked point, closest first.
 */
export const getNearbyProperties = async (req, res) => {
  try {
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    const radius = Number(req.query.radius) || 2000;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 200);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return res.status(400).json({
        success: false,
        message: 'Query params lng and lat are required and must be numbers',
      });
    }

    const docs = await Property.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceM',
          maxDistance: radius,
          spherical: true,
          // Required: the collection carries 2dsphere indexes on both
          // `location` and `boundary`, so $geoNear can't pick one itself.
          key: 'location',
          query: buildPropertyFilter(req.query),
        },
      },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      count: docs.length,
      data: docs.map((d) => ({
        ...toFeature(d).properties,
        distanceM: Math.round(d.distanceM),
      })),
    });
  } catch (error) {
    console.error('Error finding nearby properties:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error finding nearby properties',
      error: error.message,
    });
  }
};
