const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const joinRequestController = require('../controllers/joinRequestController');
const { id, validate } = require('../validators');
const router = express.Router();

router.post('/groups/:id/join-requests', authMiddleware, id, validate, joinRequestController.requestJoin);
router.get('/groups/:id/join-requests', authMiddleware, id, validate, joinRequestController.getGroupJoinRequests);
router.get('/join-requests/me', authMiddleware, joinRequestController.getMyJoinRequests);
router.put('/join-requests/:id/accept', authMiddleware, id, validate, joinRequestController.acceptJoinRequest);
router.put('/join-requests/:id/reject', authMiddleware, id, validate, joinRequestController.rejectJoinRequest);

module.exports = router;
