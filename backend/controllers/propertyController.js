import fs from 'fs';
import Property from '../models/Property.js';
import { buildPropertyFilter } from './gisController.js';
import { isValidLngLat } from '../lib/geo.js';

const STRING_FIELDS = [
  'propertyName',
  'zoneClassification',
  'frontFacing',
  'roadConnectivity',
  'cluAvailability',
  'nearbyRoadName',
  'plotNumber',
  'estate',
  'pocket',
  'plotSizeLabel',
  'khasraNo',
  'ownerName',
  'notes',
  'landUse',
  'status',
];

const NUMBER_FIELDS = [
  'roadWidthFt',
  'lengthM',
  'widthM',
  'ratePerSqFt',
  'latitude',
  'longitude',
  'areaSqm',
  'areaAcres',
];

const SORTABLE = new Set([
  'createdAt', 'updatedAt', 'propertyName', 'plotNumber',
  'ratePerSqFt', 'areaSqm', 'areaAcres', 'roadWidthFt', 'status', 'landUse',
]);

/**
 * Coordinates arrive from the map as a JSON string inside multipart form data,
 * and different callers spell them differently. Accept the reasonable shapes
 * and normalise to GeoJSON [lng, lat].
 */
function parseCoordPair(value) {
  if (!value) return null;

  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      const parts = raw.split(',').map(Number);
      raw = parts.length === 2 ? parts : null;
    }
  }
  if (!raw) return null;

  // { type: 'Point', coordinates: [lng, lat] }
  if (raw.type === 'Point' && isValidLngLat(raw.coordinates)) {
    return raw.coordinates.slice(0, 2).map(Number);
  }
  // { lat, lng }
  if (Number.isFinite(Number(raw.lng)) && Number.isFinite(Number(raw.lat))) {
    return [Number(raw.lng), Number(raw.lat)];
  }
  // [lng, lat]
  if (isValidLngLat(raw)) return raw.slice(0, 2).map(Number);

  return null;
}

/** Same idea for a traced outline: accept GeoJSON, a ring, or {lat,lng} objects. */
function parseRing(value) {
  if (!value) return null;

  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Full GeoJSON polygon / feature
  if (raw?.type === 'Feature') raw = raw.geometry;
  if (raw?.type === 'Polygon' && Array.isArray(raw.coordinates)) return raw.coordinates;

  if (!Array.isArray(raw) || !raw.length) return null;

  // Already a list of rings: [[[lng,lat], ...]]
  if (Array.isArray(raw[0]) && Array.isArray(raw[0][0])) return raw;

  const ring = raw
    .map((pt) => {
      if (Number.isFinite(Number(pt?.lng)) && Number.isFinite(Number(pt?.lat))) {
        return [Number(pt.lng), Number(pt.lat)];
      }
      return isValidLngLat(pt) ? [Number(pt[0]), Number(pt[1])] : null;
    })
    .filter(Boolean);

  return ring.length >= 3 ? [ring] : null;
}

/** Collect the writable fields out of a request body. */
function collectFields(body, { partial }) {
  const out = {};

  for (const field of STRING_FIELDS) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (value === '' && partial) {
      out[field] = undefined;
    } else if (value !== '') {
      out[field] = value;
    }
  }

  for (const field of NUMBER_FIELDS) {
    if (body[field] === undefined) continue;
    out[field] = body[field] === '' ? undefined : Number(body[field]);
  }

  const point = parseCoordPair(body.location);
  if (point) out.location = { type: 'Point', coordinates: point };
  else if (body.location === '' || body.location === 'null') out.location = undefined;

  const rings = parseRing(body.boundary);
  if (rings) out.boundary = { type: 'Polygon', coordinates: rings };
  else if (body.boundary === '' || body.boundary === 'null') out.boundary = undefined;

  return out;
}

function cleanupFiles(files) {
  if (!files?.length) return;
  files.forEach((file) => {
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Failed to clean up ${file.path}:`, err);
      }
    }
  });
}

// Get all properties (paginated, and filterable with the same params as the map)
export const getAllProperties = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = buildPropertyFilter(req.query);

    const sortField = SORTABLE.has(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      Property.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      data: properties
    });
  } catch (error) {
    console.error("Error fetching properties:", error);

    res.status(500).json({
      success: false,
      message: "Server Error fetching properties",
      error: error.message
    });
  }
};

// Get single property by ID
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error(`Error fetching property ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching property',
      error: error.message
    });
  }
};

// Create a new property
export const createProperty = async (req, res) => {
  try {
    const filePaths = req.files ? req.files.map(file => file.path) : [];

    const newProperty = new Property({
      ...collectFields(req.body, { partial: false }),
      mediaFiles: filePaths
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully!',
      data: savedProperty
    });
  } catch (error) {
    console.error('Error creating property:', error);
    // Cleanup uploaded files on validation or save error
    cleanupFiles(req.files);
    res.status(500).json({
      success: false,
      message: 'Server Error creating property',
      error: error.message
    });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      // Cleanup uploaded files since property does not exist
      cleanupFiles(req.files);
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const updateData = collectFields(req.body, { partial: true });

    // Handle media files logic
    let currentMedia = [...property.mediaFiles];

    // Check if client requested to delete some existing files
    // e.g. body.deleteFiles could be an array or string containing paths to delete
    if (req.body.deleteFiles) {
      let filesToDelete = [];
      try {
        filesToDelete = typeof req.body.deleteFiles === 'string'
          ? JSON.parse(req.body.deleteFiles)
          : req.body.deleteFiles;
      } catch (e) {
        // Fallback for comma separated or single string
        filesToDelete = Array.isArray(req.body.deleteFiles)
          ? req.body.deleteFiles
          : [req.body.deleteFiles];
      }

      filesToDelete.forEach(filePath => {
        const index = currentMedia.indexOf(filePath);
        if (index > -1) {
          currentMedia.splice(index, 1);
          // Delete file from filesystem
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.error(`Failed to delete file ${filePath}:`, err);
            }
          }
        }
      });
    }

    // Append new uploaded files
    if (req.files && req.files.length > 0) {
      const newPaths = req.files.map(file => file.path);
      currentMedia = [...currentMedia, ...newPaths];
    }

    updateData.mediaFiles = currentMedia;

    // Assign and save through the document so the geometry/area hooks run.
    property.set(updateData);

    // Recompute derived area when the outline or dimensions changed but the
    // client didn't send an explicit area.
    if (req.body.areaSqm === undefined &&
        (updateData.boundary !== undefined ||
         updateData.lengthM !== undefined ||
         updateData.widthM !== undefined)) {
      property.areaSqm = undefined;
      property.areaAcres = undefined;
    }

    const updatedProperty = await property.save();

    res.status(200).json({
      success: true,
      message: 'Property updated successfully!',
      data: updatedProperty
    });
  } catch (error) {
    console.error(`Error updating property ${req.params.id}:`, error);
    // Cleanup newly uploaded files on error
    cleanupFiles(req.files);
    res.status(500).json({
      success: false,
      message: 'Server Error updating property',
      error: error.message
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Delete associated media files from disk
    if (property.mediaFiles && property.mediaFiles.length > 0) {
      property.mediaFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Failed to delete file ${filePath} on property deletion:`, err);
          }
        }
      });
    }

    // Delete from database
    await Property.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Property and its files deleted successfully!'
    });
  } catch (error) {
    console.error(`Error deleting property ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error deleting property',
      error: error.message
    });
  }
};

/**
 * PATCH /api/properties/:id/geometry
 * Lightweight endpoint for dragging a pin or reshaping an outline on the map,
 * without resubmitting the whole form.
 */
export const updatePropertyGeometry = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const point = parseCoordPair(req.body.location);
    const rings = parseRing(req.body.boundary);

    if (!point && !rings) {
      return res.status(400).json({
        success: false,
        message: 'Provide a location point or a boundary outline',
      });
    }

    if (point) property.location = { type: 'Point', coordinates: point };
    if (rings) {
      property.boundary = { type: 'Polygon', coordinates: rings };
      // Let the model recompute area and centroid from the new outline.
      if (!point) property.location = undefined;
      property.areaSqm = undefined;
      property.areaAcres = undefined;
    }

    const saved = await property.save();

    res.status(200).json({ success: true, message: 'Geometry updated', data: saved });
  } catch (error) {
    console.error(`Error updating geometry for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error updating geometry',
      error: error.message,
    });
  }
};
