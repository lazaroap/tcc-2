const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const validateId = param('id').notEmpty().withMessage('ID inválido');
const validateUpdateUser = [
    body('name').optional().trim().escape().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').optional().trim().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
];

router.get('/users', authMiddleware, userController.getUsers);
router.get('/users/:id', authMiddleware, validateId, userController.getUser);
router.put('/users/:id', authMiddleware, validateId, validateUpdateUser, userController.updateUser);
router.delete('/users/:id', authMiddleware, validateId, userController.deleteUser);

module.exports = router;
