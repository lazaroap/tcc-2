const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { validationResult } = require('express-validator');

function omitPassword(user) {
    if (!user) return user;
    const { password, ...rest } = user;
    return rest;
}

exports.createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário', message: error.message });
    }
};

exports.getUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;

    try {
        const user = await db.user.findUnique({
            where: { id: id },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.status(200).json(omitPassword(user));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário', message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await db.user.findMany();
        res.status(200).json(users.map(omitPassword));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários', message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name, email, phone, avatar, age, gender, password } = req.body;
    const targetId = id;

    if (req.user.id !== targetId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para atualizar este usuário' });
    }

    try {
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

        const user = await db.user.update({
            where: { id: targetId },
            data,
        });

        res.status(200).json(omitPassword(user));
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário', message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;

    if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Sem permissão para excluir este usuário' });
    }

    try {
        const user = await db.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        await db.user.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar:', error);

        if (error.code === 'P2014' || error.code === 'P2003') {
            return res.status(400).json({
                error: 'Não é possível deletar este usuário. Existem dados vinculados (grupos, avaliações, etc).',
                message: error.message,
            });
        }

        res.status(500).json({ error: 'Erro ao deletar usuário', message: error.message });
    }
};
