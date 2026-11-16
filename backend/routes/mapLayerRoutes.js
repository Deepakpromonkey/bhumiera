import express from 'express';
import upload from '../middleware/upload.js';
import auth from '../middleware/auth.js';
import {
  getMapLayers,
  getMapLayerById,
  createMapLayer,
  updateMapLayer,
  deleteMapLayer
} from '../controllers/mapLayerController.js';

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getMapLayers)
  .post(upload.single('image'), createMapLayer);

router.route('/:id')
  .get(getMapLayerById)
  .put(upload.single('image'), updateMapLayer)
  .delete(deleteMapLayer);

// Alternative verbs, matching the style already used by the property routes
router.post('/update/:id', upload.single('image'), updateMapLayer);
router.post('/delete/:id', deleteMapLayer);

export default router;
