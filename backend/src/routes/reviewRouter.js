const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');
const { id, providerId, groupId, createReviewRules, updateReviewRules, validate } = require('../validators');
const router = express.Router();

router.post('/providers/:providerId/reviews', authMiddleware, providerId, createReviewRules, validate, reviewController.createReview);
router.get('/groups/:groupId/reviews', authMiddleware, groupId, validate, reviewController.getGroupReviews);
router.get('/providers/:providerId/reviews', providerId, validate, reviewController.getProviderReviews);
router.put('/reviews/:id', authMiddleware, id, updateReviewRules, validate, reviewController.updateReview);
router.delete('/reviews/:id', authMiddleware, id, validate, reviewController.deleteReview);

module.exports = router;
