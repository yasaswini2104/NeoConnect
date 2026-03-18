import express from 'express';
import {
  getAllUsers,
  getCaseManagers,
  updateUser,
  deactivateUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// /case-managers must come before /:id
router.get('/case-managers', protect, authorize('secretariat', 'admin'), getCaseManagers);
router.get('/', protect, authorize('admin', 'secretariat'), getAllUsers);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deactivateUser);

export default router;
