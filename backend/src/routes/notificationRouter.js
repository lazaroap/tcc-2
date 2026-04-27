const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');
const { id, validate } = require('../validators');
const router = express.Router();

router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.get('/notifications/unread-count', authMiddleware, notificationController.getUnreadCount);
router.put('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);
router.put('/notifications/:id/read', authMiddleware, id, validate, notificationController.markAsRead);

module.exports = router;
