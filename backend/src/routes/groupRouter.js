const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const groupController = require('../controllers/groupController');
const { id, memberId, createGroupRules, addMemberRules, transferOwnershipRules, validate } = require('../validators');

router.post('/groups', authMiddleware, createGroupRules, validate, groupController.createGroup);
router.get('/groups/me', authMiddleware, groupController.getMyGroups);
router.get('/groups/:id', authMiddleware, id, validate, groupController.getGroup);
router.get('/groups', authMiddleware, groupController.getGroups);
router.put('/groups/:id', authMiddleware, id, validate, groupController.updateGroup);
router.delete('/groups/:id', authMiddleware, id, validate, groupController.deleteGroup);
router.post('/groups/:id/members', authMiddleware, id, addMemberRules, validate, groupController.addMember);
router.delete('/groups/:id/members/:memberId', authMiddleware, id, memberId, validate, groupController.removeMember);
router.delete('/groups/:id/leave', authMiddleware, id, validate, groupController.leaveGroup);
router.put('/groups/:id/transfer', authMiddleware, id, transferOwnershipRules, validate, groupController.transferOwnership);

module.exports = router;
