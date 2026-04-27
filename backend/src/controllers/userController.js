const bcrypt = require('bcryptjs');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

function omitPassword(user) {
    if (!user) return user;
    const { password, refreshToken, ...rest } = user;
    return rest;
}

exports.getMe = asyncHandler(async (req, res) => {
    const user = await db.user.findUnique({
        where: { id: req.user.id },
        include: {
            provider: {
                include: {
                    reviews: { select: { rating: true } },
                },
            },
        },
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const result = omitPassword(user);

    if (result.provider?.reviews) {
        const reviews = result.provider.reviews;
        const avg = reviews.length ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)) : null;
        result.provider.averageRating = avg;
        result.provider.reviewCount = reviews.length;
        delete result.provider.reviews;
    }

    res.status(200).json(result);
});

exports.getUser = asyncHandler(async (req, res) => {
    const user = await db.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.status(200).json(omitPassword(user));
});

exports.getUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([db.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }), db.user.count()]);

    res.status(200).json({
        users: users.map(omitPassword),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, avatar, age, gender, password } = req.body;

    if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para atualizar este usuário' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (age !== undefined) data.age = age;
    if (gender !== undefined) data.gender = gender;
    if (password !== undefined && password !== '') {
        data.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({ where: { id }, data });
    res.status(200).json(omitPassword(user));
});

exports.deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir este usuário' });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    await db.user.delete({ where: { id } });
    res.status(204).send();
});
