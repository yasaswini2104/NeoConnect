import express from 'express';
import {
  getOverview,
  getHeatmap,
  getHotspots,
  getCaseManagerStats,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const guard = [protect, authorize('secretariat', 'admin')];

router.get('/overview', ...guard, getOverview);
router.get('/heatmap',  ...guard, getHeatmap);
router.get('/hotspots', ...guard, getHotspots);
router.get('/case-manager-stats', ...guard, getCaseManagerStats);

export default router;
