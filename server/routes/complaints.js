import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  trackComplaint,
  assignComplaint,
  updateStatus,
  addNote,
  publishComplaint,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

router.get('/track/:trackingId', protect, trackComplaint);
router.post('/', protect, upload.array('files', 5), createComplaint);
router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/assign', protect, authorize('secretariat', 'admin'), assignComplaint);
router.put('/:id/status', protect, authorize('case_manager', 'secretariat', 'admin'), updateStatus);
router.post('/:id/notes', protect, authorize('case_manager', 'secretariat', 'admin'), addNote);
router.put('/:id/publish', protect, authorize('secretariat', 'admin'), publishComplaint);

export default router;
