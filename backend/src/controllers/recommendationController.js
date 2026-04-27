const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { checkMembership, isGroupAdmin } = require('../utils/membership');
const { createNotification } = require('./notificationController');

exports.createRecommendation = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { title, description, providerId, externalName, externalCategory, externalPhone } = req.body;
    const authorId = req.user.id;

    const membership = await checkMembership(authorId, groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não e membro deste grupo' });

    if (!providerId && !externalName) {
        return res.status(400).json({ error: 'Informe um prestador cadastrado ou preencha os dados do prestador externo' });
    }

    const data = {
        title,
        description: description || null,
        authorId,
        groupId,
    };

    let provider = null;

    if (providerId) {
        provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });
        data.providerId = providerId;
    } else {
        if (!externalPhone) {
            return res.status(400).json({ error: 'Telefone do prestador externo e obrigatório' });
        }
        data.externalName = externalName;
        data.externalCategory = externalCategory ? externalCategory.toLowerCase() : null;
        data.externalPhone = externalPhone;
    }

    const recommendation = await db.recommendation.create({
        data,
        include: {
            author: { select: { id: true, name: true, avatar: true } },
            provider: {
                include: { user: { select: { id: true, name: true } } },
            },
            _count: { select: { votes: true, comments: true } },
        },
    });

    if (provider) {
        await createNotification(
            provider.userId,
            'NEW_RECOMMENDATION',
            `${recommendation.author.name} recomendou você em um grupo`,
            recommendation.id
        );
    }

    res.status(201).json(recommendation);
});

exports.getGroupRecommendations = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const userId = req.user.id;
    const { sort } = req.query;

    const membership = await checkMembership(userId, groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });

    const [recommendations, total] = await Promise.all([
        db.recommendation.findMany({
            where: { groupId },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                provider: {
                    include: {
                        user: { select: { id: true, name: true } },
                        reviews: { select: { rating: true } },
                    },
                },
                votes: { select: { userId: true, type: true } },
                _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
            ...(sort !== 'score' ? { skip, take: limit } : {}),
        }),
        db.recommendation.count({ where: { groupId } }),
    ]);

    const enriched = recommendations.map((rec) => {
        const upvotes = rec.votes.filter((v) => v.type === 'UP').length;
        const downvotes = rec.votes.filter((v) => v.type === 'DOWN').length;
        const userVote = rec.votes.find((v) => v.userId === userId)?.type || null;

        const { votes, ...rest } = rec;

        let providerData = null;
        if (rec.provider) {
            const reviews = rec.provider.reviews || [];
            const avgRating = reviews.length ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)) : null;
            const { reviews: _, ...providerRest } = rec.provider;
            providerData = { ...providerRest, averageRating: avgRating, reviewCount: reviews.length };
        }

        return {
            ...rest,
            provider: providerData,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            userVote,
        };
    });

    if (sort === 'score') {
        enriched.sort((a, b) => b.score - a.score);
        const paginated = enriched.slice(skip, skip + limit);
        return res.status(200).json({
            recommendations: paginated,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    res.status(200).json({
        recommendations: enriched,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.deleteRecommendation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const rec = await db.recommendation.findUnique({ where: { id } });
    if (!rec) return res.status(404).json({ error: 'Recomendacao não encontrada' });

    const groupAdmin = await isGroupAdmin(userId, rec.groupId);
    if (rec.authorId !== userId && !groupAdmin && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir esta recomendacao' });
    }

    await db.recommendation.delete({ where: { id } });
    res.status(204).send();
});

exports.voteRecommendation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    const rec = await db.recommendation.findUnique({ where: { id } });
    if (!rec) return res.status(404).json({ error: 'Recomendacao não encontrada' });

    const membership = await checkMembership(userId, rec.groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });

    const vote = await db.recommendationVote.upsert({
        where: { userId_recommendationId: { userId, recommendationId: id } },
        update: { type },
        create: { userId, recommendationId: id, type },
    });

    res.status(200).json(vote);
});

exports.removeVote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await db.recommendationVote.delete({
            where: { userId_recommendationId: { userId, recommendationId: id } },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Voto não encontrado' });
        throw error;
    }
});

exports.getComments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        db.recommendationComment.findMany({
            where: { recommendationId: id },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
        }),
        db.recommendationComment.count({ where: { recommendationId: id } }),
    ]);

    res.status(200).json({
        comments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const rec = await db.recommendation.findUnique({ where: { id } });
    if (!rec) return res.status(404).json({ error: 'Recomendação não encontrada' });

    const membership = await checkMembership(userId, rec.groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });

    const comment = await db.recommendationComment.create({
        data: { content, userId, recommendationId: id },
        include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    if (rec.authorId !== userId) {
        await createNotification(rec.authorId, 'NEW_COMMENT', `${comment.user.name} comentou na sua recomendação`, rec.id);
    }

    res.status(201).json(comment);
});

exports.updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await db.recommendationComment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });

    if (comment.userId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para editar este comentário' });
    }

    const updated = await db.recommendationComment.update({
        where: { id: commentId },
        data: { content },
        include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(200).json(updated);
});

exports.deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await db.recommendationComment.findUnique({
        where: { id: commentId },
        include: { recommendation: { select: { groupId: true } } },
    });
    if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });

    const groupAdmin = await isGroupAdmin(userId, comment.recommendation.groupId);
    if (comment.userId !== userId && !groupAdmin && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
    }

    await db.recommendationComment.delete({ where: { id: commentId } });
    res.status(204).send();
});

exports.createRequest = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { title, description, category } = req.body;
    const authorId = req.user.id;

    const membership = await checkMembership(authorId, groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });

    const request = await db.recommendationRequest.create({
        data: {
            title,
            description: description || null,
            category: category ? category.toLowerCase() : null,
            authorId,
            groupId,
        },
        include: {
            author: { select: { id: true, name: true, avatar: true } },
        },
    });

    res.status(201).json(request);
});

exports.getGroupRequests = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const membership = await checkMembership(userId, groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });

    const [requests, total] = await Promise.all([
        db.recommendationRequest.findMany({
            where: { groupId },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                replies: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { replies: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.recommendationRequest.count({ where: { groupId } }),
    ]);

    res.status(200).json({
        requests,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.deleteRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await db.recommendationRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Pedido não encontrado' });

    const groupAdmin = await isGroupAdmin(userId, request.groupId);
    if (request.authorId !== userId && !groupAdmin && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir este pedido' });
    }

    await db.recommendationRequest.delete({ where: { id } });
    res.status(204).send();
});

exports.addRequestReply = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const request = await db.recommendationRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Pedido não encontrado' });

    const membership = await checkMembership(userId, request.groupId);
    if (!membership) return res.status(403).json({ error: 'Voce não é membro deste grupo' });
    if (request.resolved) {
        return res.status(400).json({ error: 'Este pedido ja foi resolvido' });
    }

    const reply = await db.requestReply.create({
        data: { content, userId, requestId: id },
        include: { user: { select: { id: true, name: true } } },
    });

    if (request.authorId !== userId) {
        await createNotification(request.authorId, 'NEW_REQUEST_REPLY', `${reply.user.name} respondeu ao seu pedido de recomendação`, request.id);
    }

    res.status(201).json(reply);
});

exports.deleteRequestReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const userId = req.user.id;

    const reply = await db.requestReply.findUnique({
        where: { id: replyId },
        include: { request: { select: { groupId: true } } },
    });
    if (!reply) return res.status(404).json({ error: 'Resposta não encontrada' });

    const groupAdmin = await isGroupAdmin(userId, reply.request.groupId);
    if (reply.userId !== userId && !groupAdmin && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir esta resposta' });
    }

    await db.requestReply.delete({ where: { id: replyId } });
    res.status(204).send();
});

exports.resolveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await db.recommendationRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Pedido não encontrado' });

    const groupAdmin = await isGroupAdmin(userId, request.groupId);
    if (request.authorId !== userId && !groupAdmin && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para marcar como resolvido' });
    }

    const updated = await db.recommendationRequest.update({
        where: { id },
        data: { resolved: true },
    });

    res.status(200).json(updated);
});
