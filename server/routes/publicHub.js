import express from 'express';
import {
  getDigest,
  getImpact,
  uploadMinutes,
  getMinutes,
} from '../controllers/publicHubController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

router.get('/digest', protect, getDigest);
router.get('/impact', protect, getImpact);
router.post('/minutes', protect, authorize('secretariat', 'admin'), upload.single('file'), uploadMinutes);
router.get('/minutes',  protect, getMinutes);

export default router;
