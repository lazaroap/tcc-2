const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.post('/upload/avatar', authMiddleware, uploadController.handleUpload, uploadController.uploadAvatar);

module.exports = router;
