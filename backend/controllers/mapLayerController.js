import fs from 'fs';
import MapLayer from '../models/MapLayer.js';

/** Turn a multer file into the public URL the frontend will request. */
function toPublicUrl(file) {
  return `/uploads/${file.filename}`;
}

/** Pull the four bound values out of a multipart body (all strings there). */
function parseBounds(body) {
  const bounds = {};
  let seen = 0;

  for (const key of ['south', 'west', 'north', 'east']) {
    const raw = body[key] ?? body[`bounds[${key}]`] ?? body.bounds?.[key];
    const num = Number(raw);
    if (Number.isFinite(num)) {
      bounds[key] = num;
      seen++;
    }
  }

  return seen === 4 ? bounds : null;
}

// GET /api/map-layers
export const getMapLayers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.estate) filter.estate = req.query.estate;
    if (req.query.visible === 'true') filter.visible = true;

    const layers = await MapLayer.find(filter).sort({ zIndex: 1, createdAt: 1 }).lean();

    res.status(200).json({ success: true, count: layers.length, data: layers });
  } catch (error) {
    console.error('Error fetching map layers:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching map layers',
      error: error.message,
    });
  }
};

// GET /api/map-layers/:id
export const getMapLayerById = async (req, res) => {
  try {
    const layer = await MapLayer.findById(req.params.id);
    if (!layer) {
      return res.status(404).json({ success: false, message: 'Map layer not found' });
    }
    res.status(200).json({ success: true, data: layer });
  } catch (error) {
    console.error(`Error fetching map layer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching map layer',
      error: error.message,
    });
  }
};

// POST /api/map-layers   (multipart: field "image")
export const createMapLayer = async (req, res) => {
  try {
    const { name, description, estate, kind, rotationDeg, opacity, zIndex, visible } = req.body;

    if (!name) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Layer name is required' });
    }

    const layerKind = kind === 'geojson' ? 'geojson' : 'imageOverlay';

    let geojson;
    if (layerKind === 'geojson' && req.body.geojson) {
      try {
        geojson = typeof req.body.geojson === 'string'
          ? JSON.parse(req.body.geojson)
          : req.body.geojson;
      } catch {
        return res.status(400).json({ success: false, message: 'geojson must be valid JSON' });
      }
    }

    if (layerKind === 'imageOverlay' && !req.file && !req.body.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'An image file or imageUrl is required for an image overlay',
      });
    }

    const layer = await MapLayer.create({
      name,
      description,
      estate,
      kind: layerKind,
      imageUrl: req.file ? toPublicUrl(req.file) : req.body.imageUrl,
      bounds: parseBounds(req.body) || undefined,
      rotationDeg: Number.isFinite(Number(rotationDeg)) ? Number(rotationDeg) : 0,
      opacity: Number.isFinite(Number(opacity)) ? Number(opacity) : 0.75,
      zIndex: Number.isFinite(Number(zIndex)) ? Number(zIndex) : 400,
      visible: visible === undefined ? true : visible === 'true' || visible === true,
      geojson,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'Map layer created', data: layer });
  } catch (error) {
    console.error('Error creating map layer:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Server Error creating map layer',
      error: error.message,
    });
  }
};

// PUT /api/map-layers/:id   — also how the calibration UI saves corner drags
export const updateMapLayer = async (req, res) => {
  try {
    const layer = await MapLayer.findById(req.params.id);
    if (!layer) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Map layer not found' });
    }

    const update = {};

    for (const field of ['name', 'description', 'estate', 'imageUrl']) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    for (const field of ['rotationDeg', 'opacity', 'zIndex']) {
      const num = Number(req.body[field]);
      if (req.body[field] !== undefined && Number.isFinite(num)) update[field] = num;
    }

    for (const field of ['visible', 'locked']) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field] === 'true' || req.body[field] === true;
      }
    }

    const bounds = parseBounds(req.body);
    if (bounds) update.bounds = bounds;

    if (req.body.geojson !== undefined) {
      try {
        update.geojson = typeof req.body.geojson === 'string'
          ? JSON.parse(req.body.geojson)
          : req.body.geojson;
      } catch {
        return res.status(400).json({ success: false, message: 'geojson must be valid JSON' });
      }
    }

    // Replacing the image drops the previous file from disk.
    if (req.file) {
      const previous = layer.imageUrl;
      update.imageUrl = toPublicUrl(req.file);

      if (previous?.startsWith('/uploads/')) {
        const onDisk = `.${previous}`;
        if (fs.existsSync(onDisk)) {
          try {
            fs.unlinkSync(onDisk);
          } catch (err) {
            console.error(`Failed to delete replaced overlay ${onDisk}:`, err);
          }
        }
      }
    }

    const updated = await MapLayer.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Map layer updated', data: updated });
  } catch (error) {
    console.error(`Error updating map layer ${req.params.id}:`, error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Server Error updating map layer',
      error: error.message,
    });
  }
};

// DELETE /api/map-layers/:id
export const deleteMapLayer = async (req, res) => {
  try {
    const layer = await MapLayer.findById(req.params.id);
    if (!layer) {
      return res.status(404).json({ success: false, message: 'Map layer not found' });
    }

    if (layer.imageUrl?.startsWith('/uploads/')) {
      const onDisk = `.${layer.imageUrl}`;
      if (fs.existsSync(onDisk)) {
        try {
          fs.unlinkSync(onDisk);
        } catch (err) {
          console.error(`Failed to delete overlay image ${onDisk}:`, err);
        }
      }
    }

    await MapLayer.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Map layer deleted' });
  } catch (error) {
    console.error(`Error deleting map layer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error deleting map layer',
      error: error.message,
    });
  }
};
