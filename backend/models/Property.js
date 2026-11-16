import mongoose from 'mongoose';
import {
  SQM_PER_ACRE,
  isValidLngLat,
  normalizeRing,
  ringAreaSqm,
  ringCentroid,
} from '../lib/geo.js';

export const LAND_USE_OPTIONS = [
  'Industrial',
  'Commercial',
  'Residential',
  'Institutional',
  'Group Housing',
  'Public Utility',
  'Green Belt',
  'R&R',
  'Mixed Use',
  'Agricultural',
  'Other',
];

export const STATUS_OPTIONS = [
  'Available',
  'Reserved',
  'Allotted',
  'Sold',
  'Under Litigation',
  'Not For Sale',
];

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    // GeoJSON order is [longitude, latitude] — not the lat/lng people expect.
    coordinates: { type: [Number], default: undefined },
  },
  { _id: false }
);

const polygonSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], default: undefined },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true },
    zoneClassification: { type: String },

    frontFacing: { type: String },
    roadWidthFt: { type: Number },
    roadConnectivity: { type: String },
    lengthM: { type: Number },
    widthM: { type: Number },

    ratePerSqFt: { type: Number },
    cluAvailability: { type: String, enum: ['Available', 'In-Process', 'Not Available'] },

    nearbyRoadName: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },

    mediaFiles: [{ type: String }],

    // ── GIS fields ─────────────────────────────────────────────────────────
    plotNumber: { type: String, trim: true },
    estate: { type: String, trim: true },
    pocket: { type: String, trim: true },
    plotSizeLabel: { type: String, trim: true },
    khasraNo: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    notes: { type: String },

    landUse: { type: String, enum: LAND_USE_OPTIONS },
    status: { type: String, enum: STATUS_OPTIONS, default: 'Available' },

    areaSqm: { type: Number },
    areaAcres: { type: Number },

    // Marker position. Always kept in sync with latitude/longitude.
    location: { type: pointSchema, default: undefined },
    // Traced plot outline, when the user draws one instead of dropping a pin.
    boundary: { type: polygonSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

/**
 * Keep the three ways of expressing position consistent, whichever one the
 * client supplied: boundary → location → latitude/longitude.
 *
 * Mongoose 9 dropped `next` from document middleware — hooks run synchronously
 * or return a promise, so this takes no arguments.
 */
propertySchema.pre('validate', function syncGeometry() {
  // 1. Normalize a drawn boundary and drop it if it can't form a real ring.
  if (this.boundary && Array.isArray(this.boundary.coordinates)) {
    const rings = this.boundary.coordinates
      .map(normalizeRing)
      .filter(Boolean);

    if (rings.length) {
      this.boundary = { type: 'Polygon', coordinates: rings };
    } else {
      this.boundary = undefined;
    }
  }

  // 2. Derive a marker point from the boundary when none was given.
  const hasPoint = this.location && isValidLngLat(this.location.coordinates);

  if (!hasPoint && this.boundary?.coordinates?.[0]) {
    const centre = ringCentroid(this.boundary.coordinates[0]);
    if (centre) this.location = { type: 'Point', coordinates: centre };
  }

  // 3. Fall back to the legacy latitude/longitude pair.
  if (
    !(this.location && isValidLngLat(this.location.coordinates)) &&
    Number.isFinite(this.latitude) &&
    Number.isFinite(this.longitude)
  ) {
    this.location = { type: 'Point', coordinates: [this.longitude, this.latitude] };
  }

  // 4. Mirror the final point back onto latitude/longitude so every existing
  //    consumer of those fields keeps working unchanged.
  if (this.location && isValidLngLat(this.location.coordinates)) {
    const [lng, lat] = this.location.coordinates;
    this.longitude = lng;
    this.latitude = lat;
  } else {
    this.location = undefined;
  }

  // 5. Area: prefer a traced boundary, then length × width, then whichever
  //    of sqm/acres the client sent.
  if (!Number.isFinite(this.areaSqm)) {
    if (this.boundary?.coordinates?.[0]) {
      const measured = ringAreaSqm(this.boundary.coordinates[0]);
      if (measured) this.areaSqm = Math.round(measured * 100) / 100;
    } else if (Number.isFinite(this.lengthM) && Number.isFinite(this.widthM)) {
      this.areaSqm = Math.round(this.lengthM * this.widthM * 100) / 100;
    } else if (Number.isFinite(this.areaAcres)) {
      this.areaSqm = Math.round(this.areaAcres * SQM_PER_ACRE * 100) / 100;
    }
  }

  if (Number.isFinite(this.areaSqm) && !Number.isFinite(this.areaAcres)) {
    this.areaAcres = Math.round((this.areaSqm / SQM_PER_ACRE) * 10000) / 10000;
  }
});

propertySchema.index({ location: '2dsphere' });
propertySchema.index({ boundary: '2dsphere' });
propertySchema.index({ landUse: 1, status: 1 });
propertySchema.index({ estate: 1, pocket: 1 });
propertySchema.index({ plotNumber: 1 });

export default mongoose.model('Property', propertySchema);
