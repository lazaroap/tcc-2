const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

const loginValidators = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
];

const registerValidators = [
    body('name').notEmpty().withMessage('Nome é obrigatório').trim().escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter ao menos 8 caracteres'),
];

const refreshTokenValidators = [
    body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório'),
];

router.post('/login', loginValidators, authController.login);
router.post('/register', registerValidators, authController.registerUser);
router.post('/refresh', refreshTokenValidators, authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
