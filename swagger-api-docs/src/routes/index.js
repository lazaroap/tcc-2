import express from 'express';
import { getNotifications, getUnreadCount } from '../controllers/index.js';

const router = express.Router();

// Define API routes
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);

export default router;