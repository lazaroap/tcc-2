const express = require('express');
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middlewares/authMiddleware');
const { id, userId, createProviderRules, updateProviderRules, validate } = require('../validators');
const router = express.Router();

router.post('/providers', authMiddleware, createProviderRules, validate, providerController.createProvider);
router.get('/providers/categories', providerController.getCategories);
router.get('/providers/search', authMiddleware, providerController.searchProviders);
router.get('/providers/user/:userId', userId, validate, providerController.getProviderByUserId);
router.get('/providers', providerController.listAllProviders);
router.get('/providers/category/:category', providerController.listProvidersByCategory);
router.get('/providers/:id', id, validate, providerController.getProvider);
router.get('/providers/:id/stats', id, validate, providerController.getProviderStats);
router.put('/providers/:id', authMiddleware, id, updateProviderRules, validate, providerController.updateProvider);
router.delete('/providers/:id', authMiddleware, id, validate, providerController.deleteProvider);

module.exports = router;
