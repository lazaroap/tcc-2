const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { loginRules, registerRules, refreshTokenRules, validate } = require('../validators');
const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

router.post('/login', loginLimiter, loginRules, validate, authController.login);
router.post('/register', registerRules, validate, authController.registerUser);
router.post('/refresh', refreshTokenRules, validate, authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
