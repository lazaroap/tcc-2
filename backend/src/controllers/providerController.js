const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORIES } = require('../utils/categories');

function computeRating(reviews) {
    if (!reviews.length) return { averageRating: null, reviewCount: 0 };
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return { averageRating: parseFloat(avg.toFixed(2)), reviewCount: reviews.length };
}

exports.createProvider = asyncHandler(async (req, res) => {
    const { category, bio } = req.body;
    const userId = req.user.id;

    const existing = await db.provider.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ error: 'Este usuário já é prestador' });

    const provider = await db.provider.create({
        data: {
            userId,
            category: category.toLowerCase(),
            bio: bio || null,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(provider);
});

exports.getProvider = asyncHandler(async (req, res) => {
    const provider = await db.provider.findUnique({
        where: { id: req.params.id },
        include: {
            user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
            reviews: { select: { rating: true } },
        },
    });

    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    const { reviews, ...rest } = provider;
    res.status(200).json({ ...rest, ...computeRating(reviews) });
});

exports.getProviderByUserId = asyncHandler(async (req, res) => {
    const provider = await db.provider.findUnique({
        where: { userId: req.params.userId },
        include: {
            user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
            reviews: { select: { rating: true } },
        },
    });

    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    const { reviews, ...rest } = provider;
    res.status(200).json({ ...rest, ...computeRating(reviews) });
});

exports.searchProviders = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.status(200).json({ providers: [] });
    }

    const providers = await db.provider.findMany({
        where: {
            OR: [{ user: { name: { contains: q, mode: 'insensitive' } } }, { user: { email: { contains: q, mode: 'insensitive' } } }],
        },
        include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            reviews: { select: { rating: true } },
        },
        take: 10,
    });

    const results = providers.map(({ reviews, ...p }) => ({ ...p, ...computeRating(reviews) }));
    res.status(200).json({ providers: results });
});

exports.getCategories = asyncHandler(async (req, res) => {
    res.status(200).json({ categories: CATEGORIES });
});

exports.getProviderStats = asyncHandler(async (req, res) => {
    const provider = await db.provider.findUnique({
        where: { id: req.params.id },
        include: {
            reviews: { select: { rating: true, createdAt: true } },
            recommendations: { select: { id: true } },
        },
    });

    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    const { reviews } = provider;
    const total = reviews.length;
    const avg = total ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)) : null;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
        distribution[r.rating]++;
    });

    // Tendencia mensal (ultimos 6 meses com dados)
    const monthMap = {};
    reviews.forEach((r) => {
        const month = r.createdAt.toISOString().substring(0, 7); // "YYYY-MM"
        if (!monthMap[month]) monthMap[month] = { count: 0, sum: 0 };
        monthMap[month].count++;
        monthMap[month].sum += r.rating;
    });
    const trend = Object.entries(monthMap)
        .map(([month, data]) => ({
            month,
            count: data.count,
            avg: parseFloat((data.sum / data.count).toFixed(2)),
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

    res.status(200).json({
        providerId: provider.id,
        averageRating: avg,
        reviewCount: total,
        distribution,
        trend,
        recommendationCount: provider.recommendations.length,
    });
});

exports.listAllProviders = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const { search, category, sort } = req.query;

    const where = {};
    if (category) where.category = { equals: category, mode: 'insensitive' };
    if (search) {
        where.OR = [
            { category: { contains: search.toLowerCase() } },
            { bio: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
    }

    if (sort === 'rating') {
        const all = await db.provider.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                reviews: { select: { rating: true } },
            },
        });

        const withRating = all
            .map(({ reviews, ...p }) => ({ ...p, ...computeRating(reviews) }))
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

        const total = withRating.length;
        const paginated = withRating.slice((page - 1) * limit, page * limit);

        return res.status(200).json({
            providers: paginated,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    const [providers, total] = await Promise.all([
        db.provider.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                reviews: { select: { rating: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.provider.count({ where }),
    ]);

    const withRating = providers.map(({ reviews, ...p }) => ({ ...p, ...computeRating(reviews) }));

    res.status(200).json({
        providers: withRating,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.listProvidersByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const where = { category: { equals: category, mode: 'insensitive' } };

    const [providers, total] = await Promise.all([
        db.provider.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                reviews: { select: { rating: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.provider.count({ where }),
    ]);

    if (total === 0) {
        return res.status(404).json({ error: 'Nenhum prestador encontrado para esta categoria' });
    }

    const withRating = providers.map(({ reviews, ...p }) => ({ ...p, ...computeRating(reviews) }));

    res.status(200).json({
        providers: withRating,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.updateProvider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category, bio } = req.body;

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    if (provider.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para atualizar este prestador' });
    }

    const data = {};
    if (category !== undefined) data.category = category.toLowerCase();
    if (bio !== undefined) data.bio = bio;

    const updated = await db.provider.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(200).json(updated);
});

exports.deleteProvider = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

    if (provider.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para deletar este prestador' });
    }

    await db.provider.delete({ where: { id } });
    res.status(204).send();
});
