const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { id, updateUserRules, validate } = require('../validators');

router.get('/users/me', authMiddleware, userController.getMe);
router.get('/users', authMiddleware, userController.getUsers);
router.get('/users/:id', authMiddleware, id, validate, userController.getUser);
router.put('/users/:id', authMiddleware, id, updateUserRules, validate, userController.updateUser);
router.delete('/users/:id', authMiddleware, id, validate, userController.deleteUser);

module.exports = router;
