const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

    const provider = await db.provider.findUnique({
        where: { userId: user.id },
        select: { id: true, category: true },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });

    await db.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            provider: provider || null,
        },
        token,
        refreshToken,
    });
});

exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const hasUser = await db.user.findUnique({ where: { email } });
    if (hasUser) return res.status(409).json({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({ data: { name, email, password: hashed } });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await db.user.update({ where: { id: user.id }, data: { refreshToken } });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
        refreshToken,
    });
});

exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        return res.status(401).json({ error: 'Refresh token expirado ou inválido' });
    }

    const user = await db.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });

    await db.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
    });

    res.json({ token: newToken, refreshToken: newRefreshToken });
});

exports.logout = asyncHandler(async (req, res) => {
    await db.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null },
    });
    res.json({ message: 'Logout realizado com sucesso' });
});
