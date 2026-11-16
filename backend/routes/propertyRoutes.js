import express from 'express';
import upload from '../middleware/upload.js';
import auth from '../middleware/auth.js';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyGeometry
} from '../controllers/propertyController.js';
import {
  getPropertiesGeoJSON,
  getPropertyFacets,
  getPropertyStats,
  getNearbyProperties
} from '../controllers/gisController.js';

const router = express.Router();

// Protect all routes below this line with JWT Auth Middleware
router.use(auth);

// ── GIS endpoints ──────────────────────────────────────────────────────────
// Registered before '/:id' so these literal paths aren't captured as an id.
router.get('/geojson', getPropertiesGeoJSON);
router.get('/facets', getPropertyFacets);
router.get('/stats', getPropertyStats);
router.get('/near', getNearbyProperties);

// REST endpoints
router.route('/')
  .get(getAllProperties)
  .post(upload.array('files', 10), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(upload.array('files', 10), updateProperty)
  .delete(deleteProperty);

// Move a pin / reshape an outline straight from the map
router.patch('/:id/geometry', updatePropertyGeometry);

// Custom/Alternative endpoints to match various frontend routing preferences
router.post('/add', upload.array('files', 10), createProperty);
router.post('/create', upload.array('files', 10), createProperty);
router.post('/update/:id', upload.array('files', 10), updateProperty);
router.post('/delete/:id', deleteProperty);

export default router;
