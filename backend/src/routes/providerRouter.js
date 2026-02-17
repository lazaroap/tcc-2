const express = require('express');
const { param, query, body } = require('express-validator');
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

const validateProviderId = param('id').notEmpty().withMessage('ID inválido');
const validateCreateProvider = [body('category').notEmpty().withMessage('Categoria é obrigatória').trim(), body('bio').optional().trim().escape()];
const validateUpdateProvider = [
    body('category').optional().notEmpty().withMessage('Categoria não pode ser vazia').trim(),
    body('bio').optional().trim().escape(),
];

router.post('/providers', authMiddleware, validateCreateProvider, providerController.createProvider);
router.get('/providers', providerController.listAllProviders);
router.get('/providers/category/:category', providerController.listProvidersByCategory);
router.get('/providers/:id', validateProviderId, providerController.getProvider);
router.put('/providers/:id', authMiddleware, validateProviderId, validateUpdateProvider, providerController.updateProvider);
router.delete('/providers/:id', authMiddleware, validateProviderId, providerController.deleteProvider);

module.exports = router;
