const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const groupController = require('../controllers/groupController');

const validateId = param('id').notEmpty().withMessage('ID inválido');
const validateCreateGroup = [body('name').trim().notEmpty().withMessage('Nome do grupo é obrigatório'), body('description').optional().trim()];
const validateAddOrRemoveMember = [
    body('userId').notEmpty().withMessage('ID do usuário inválido'),
    body('groupId').notEmpty().withMessage('ID do grupo inválido'),
];

router.post('/groups', authMiddleware, validateCreateGroup, groupController.createGroup);
router.get('/groups/:id', authMiddleware, validateId, groupController.getGroup);
router.get('/groups', authMiddleware, groupController.getGroups);
router.put('/groups/:id', authMiddleware, validateId, groupController.updateGroup);
router.delete('/groups/:id', authMiddleware, validateId, groupController.deleteGroup);
router.post('/groups/:id/members', authMiddleware, validateAddOrRemoveMember, groupController.addMember);
router.delete('/groups/:id/members/:memberId', authMiddleware, validateAddOrRemoveMember, groupController.removeMember);

module.exports = router;
