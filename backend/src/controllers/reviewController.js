const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('./notificationController');

exports.createReview = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { rating, comment, groupId } = req.body;
    const userId = req.user.id;

    const provider = await db.provider.findUnique({ where: { id: providerId } });
    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    if (provider.userId === userId) {
        return res.status(400).json({ error: 'Voce não pode avaliar a si mesmo' });
    }

    const existing = await db.review.findFirst({ where: { userId, providerId } });
    if (existing) return res.status(409).json({ error: 'Voce já avaliou este prestador' });

    if (groupId) {
        const membership = await db.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    const review = await db.review.create({
        data: {
            rating,
            comment: comment || null,
            userId,
            providerId,
            groupId: groupId || null,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            provider: { select: { id: true, category: true } },
        },
    });

    await createNotification(provider.userId, 'NEW_REVIEW', `${review.user.name} avaliou voce com ${rating} estrela(s)`, review.id);

    res.status(201).json(review);
});

exports.getProviderReviews = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Filtros
    const { rating, groupId, startDate, endDate } = req.query;

    const provider = await db.provider.findUnique({ where: { id: providerId } });
    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    const where = { providerId };
    if (rating) where.rating = parseInt(rating);
    if (groupId) where.groupId = groupId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [reviews, total, aggregate] = await Promise.all([
        db.review.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                group: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.review.count({ where }),
        db.review.aggregate({
            where: { providerId },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);

    res.status(200).json({
        reviews,
        averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(2)) : null,
        reviewCount: aggregate._count.rating,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});

exports.getGroupReviews = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) return res.status(403).json({ error: 'Você não é membro deste grupo' });

    const { rating } = req.query;
    const where = { groupId };
    if (rating) where.rating = parseInt(rating);

    const [reviews, total, aggregate] = await Promise.all([
        db.review.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                provider: {
                    include: { user: { select: { id: true, name: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.review.count({ where }),
        db.review.aggregate({
            where: { groupId },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);

    res.status(200).json({
        reviews,
        averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(2)) : null,
        reviewCount: aggregate._count.rating,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await db.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });

    if (review.userId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para editar esta avaliação' });
    }

    const data = {};
    if (rating !== undefined) data.rating = rating;
    if (comment !== undefined) data.comment = comment;

    const updated = await db.review.update({
        where: { id },
        data,
        include: {
            user: { select: { id: true, name: true, avatar: true } },
        },
    });

    res.status(200).json(updated);
});

exports.deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await db.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });

    if (review.userId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para deletar esta avaliação' });
    }

    await db.review.delete({ where: { id } });
    res.status(204).send();
});
