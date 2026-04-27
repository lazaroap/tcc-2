const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const inviteController = require('../controllers/inviteController');
const { id, inviteRules, validate } = require('../validators');
const router = express.Router();

router.post('/groups/:id/invites', authMiddleware, id, inviteRules, validate, inviteController.sendInvite);
router.get('/groups/:id/invites', authMiddleware, id, validate, inviteController.getGroupInvites);
router.get('/invites/me', authMiddleware, inviteController.getMyInvites);
router.put('/invites/:id/accept', authMiddleware, id, validate, inviteController.acceptInvite);
router.put('/invites/:id/reject', authMiddleware, id, validate, inviteController.rejectInvite);

module.exports = router;
