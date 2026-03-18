import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);  
router.post('/logout', logout);        
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
