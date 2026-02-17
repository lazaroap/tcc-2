const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressValidator = require('express-validator');
const { validationResult } = expressValidator;

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await db.user.findUnique({ where: { email } });

        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no login', message: error.message });
    }
};

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

        const hashed = await bcrypt.hash(password, 10);

        const user = await db.user.create({ data: { name, email, password: hashed } });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await db.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email },
            token,
            refreshToken,
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') return res.status(409).json({ error: 'Email já cadastrado' });
        res.status(500).json({ error: 'Erro no registro', message: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { refreshToken } = req.body;

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await db.user.findUnique({ where: { id: decoded.id } });

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ error: 'Refresh token inválido' });
        }

        const newToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.json({ token: newToken });
    } catch (error) {
        console.error(error);
        res.status(401).json({
            error: 'Refresh token expirado ou inválido',
            message: error.message,
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no logout', message: error.message });
    }
};
