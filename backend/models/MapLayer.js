import mongoose from 'mongoose';

/**
 * A georeferenced overlay drawn under the property plots — typically a scanned
 * / exported layout plan (e.g. the HSIIDC IMT Kharkhauda drawing) stretched
 * onto its real-world footprint so plots can be traced directly off it.
 */
const mapLayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    estate: { type: String, trim: true },

    kind: {
      type: String,
      enum: ['imageOverlay', 'geojson'],
      default: 'imageOverlay',
    },

    // kind: 'imageOverlay'
    imageUrl: { type: String },

    // South-west / north-east corners of the un-rotated image footprint.
    bounds: {
      south: { type: Number },
      west: { type: Number },
      north: { type: Number },
      east: { type: Number },
    },

    // Clockwise rotation applied about the overlay centre, for drawings whose
    // north arrow doesn't line up with the map's north.
    rotationDeg: { type: Number, default: 0 },

    // kind: 'geojson'
    geojson: { type: mongoose.Schema.Types.Mixed },

    opacity: { type: Number, default: 0.75, min: 0, max: 1 },
    visible: { type: Boolean, default: true },
    zIndex: { type: Number, default: 400 },
    locked: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mapLayerSchema.methods.hasUsableBounds = function hasUsableBounds() {
  const b = this.bounds || {};
  return ['south', 'west', 'north', 'east'].every((k) => Number.isFinite(b[k]));
};

export default mongoose.model('MapLayer', mapLayerSchema);
