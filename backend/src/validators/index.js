const { param, body } = require('express-validator');
const { validationResult } = require('express-validator');
const { CATEGORIES } = require('../utils/categories');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const id = param('id').notEmpty().withMessage('ID inválido');
const userId = param('userId').notEmpty().withMessage('ID do usuário inválido');
const providerId = param('providerId').notEmpty().withMessage('ID do prestador inválido');
const groupId = param('groupId').notEmpty().withMessage('ID do grupo inválido');
const memberId = param('memberId').notEmpty().withMessage('ID do membro inválido');
const commentId = param('commentId').notEmpty().withMessage('ID do comentário inválido');
const replyId = param('replyId').notEmpty().withMessage('ID da resposta inválido');

const loginRules = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
];

const registerRules = [
    body('name').notEmpty().withMessage('Nome é obrigatório').trim().escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter ao menos 8 caracteres'),
];

const refreshTokenRules = [body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório')];

const updateUserRules = [
    body('name').optional().trim().escape().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).trim(),
];

const createProviderRules = [
    body('category')
        .notEmpty()
        .withMessage('Categoria é obrigatória')
        .trim()
        .toLowerCase()
        .custom((val) => {
            if (!CATEGORIES.includes(val)) throw new Error(`Categoria inválida. Válidas: ${CATEGORIES.join(', ')}`);
            return true;
        }),
    body('bio').optional().trim().escape(),
];

const updateProviderRules = [
    body('category')
        .optional()
        .notEmpty()
        .withMessage('Categoria não pode ser vazia')
        .trim()
        .toLowerCase()
        .custom((val) => {
            if (!CATEGORIES.includes(val)) throw new Error(`Categoria inválida. Válidas: ${CATEGORIES.join(', ')}`);
            return true;
        }),
    body('bio').optional().trim().escape(),
];

const createReviewRules = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser entre 1 e 5'),
    body('comment').optional().trim().escape(),
    body('groupId').optional().notEmpty().withMessage('ID do grupo inválido'),
];

const updateReviewRules = [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Nota deve ser entre 1 e 5'),
    body('comment').optional().trim().escape(),
];

const createGroupRules = [body('name').trim().notEmpty().withMessage('Nome do grupo é obrigatório'), body('description').optional().trim()];

const addMemberRules = [body('userId').notEmpty().withMessage('ID do usuário é obrigatório')];

const transferOwnershipRules = [body('newOwnerId').notEmpty().withMessage('ID do novo dono é obrigatório')];

const createRecommendationRules = [
    body('title').trim().notEmpty().withMessage('Titulo é obrigatório'),
    body('description').optional().trim(),
    body('providerId').optional().trim(),
    body('externalName').optional().trim(),
    body('externalCategory').optional().trim(),
    body('externalPhone').optional().trim(),
];

const voteRules = [body('type').isIn(['UP', 'DOWN']).withMessage('Tipo deve ser UP ou DOWN')];

const commentRules = [body('content').trim().notEmpty().withMessage('Comentario não pode ser vazio')];

const updateCommentRules = [body('content').trim().notEmpty().withMessage('Comentario não pode ser vazio')];

const createRequestRules = [
    body('title').trim().notEmpty().withMessage('Titulo é obrigatório'),
    body('description').optional().trim(),
    body('category').optional().trim(),
];

const replyRules = [body('content').trim().notEmpty().withMessage('Resposta não pode ser vazia')];

const inviteRules = [body('email').isEmail().withMessage('Email inválido')];

module.exports = {
    validate,
    id,
    providerId,
    groupId,
    memberId,
    commentId,
    replyId,
    loginRules,
    registerRules,
    refreshTokenRules,
    updateUserRules,
    createProviderRules,
    updateProviderRules,
    createReviewRules,
    updateReviewRules,
    createGroupRules,
    addMemberRules,
    transferOwnershipRules,
    createRecommendationRules,
    voteRules,
    commentRules,
    updateCommentRules,
    createRequestRules,
    replyRules,
    inviteRules,
    userId,
};
