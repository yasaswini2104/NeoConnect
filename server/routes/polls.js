import express from 'express';
import { createPoll, getPolls, castVote, closePoll } from '../controllers/pollController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('secretariat', 'admin'), createPoll);
router.get('/', protect, getPolls);
router.post('/:id/vote', protect, castVote);
router.put('/:id/close', protect, authorize('secretariat', 'admin'), closePoll);

export default router;
