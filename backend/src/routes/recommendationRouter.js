const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const recommendationController = require('../controllers/recommendationController');
const {
    id,
    groupId,
    commentId,
    replyId,
    createRecommendationRules,
    voteRules,
    commentRules,
    updateCommentRules,
    createRequestRules,
    replyRules,
    validate,
} = require('../validators');

const router = express.Router();

router.post(
    '/groups/:groupId/recommendations',
    authMiddleware,
    groupId,
    createRecommendationRules,
    validate,
    recommendationController.createRecommendation
);
router.get('/groups/:groupId/recommendations', authMiddleware, groupId, validate, recommendationController.getGroupRecommendations);
router.delete('/recommendations/:id', authMiddleware, id, validate, recommendationController.deleteRecommendation);
router.post('/recommendations/:id/vote', authMiddleware, id, voteRules, validate, recommendationController.voteRecommendation);
router.delete('/recommendations/:id/vote', authMiddleware, id, validate, recommendationController.removeVote);
router.get('/recommendations/:id/comments', authMiddleware, id, validate, recommendationController.getComments);
router.post('/recommendations/:id/comments', authMiddleware, id, commentRules, validate, recommendationController.addComment);
router.put('/recommendations/comments/:commentId', authMiddleware, commentId, updateCommentRules, validate, recommendationController.updateComment);
router.delete('/recommendations/comments/:commentId', authMiddleware, commentId, validate, recommendationController.deleteComment);
router.post('/groups/:groupId/requests', authMiddleware, groupId, createRequestRules, validate, recommendationController.createRequest);
router.get('/groups/:groupId/requests', authMiddleware, groupId, validate, recommendationController.getGroupRequests);
router.delete('/requests/:id', authMiddleware, id, validate, recommendationController.deleteRequest);
router.put('/requests/:id/resolve', authMiddleware, id, validate, recommendationController.resolveRequest);
router.post('/requests/:id/replies', authMiddleware, id, replyRules, validate, recommendationController.addRequestReply);
router.delete('/requests/replies/:replyId', authMiddleware, replyId, validate, recommendationController.deleteRequestReply);

module.exports = router;
