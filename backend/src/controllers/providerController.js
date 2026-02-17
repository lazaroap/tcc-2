const db = require('../config/database');
const expressValidator = require('express-validator');
const { validationResult } = expressValidator;

exports.createProvider = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { category, bio } = req.body;
    const userId = req.user.id;

    if (!category) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    try {
        const provider = await db.provider.create({
            data: {
                userId,
                category: category.toLowerCase(),
                bio: bio || null,
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        res.status(201).json(provider);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Este usuário já é prestador' });
        }
        res.status(500).json({ error: 'Erro ao criar prestador', message: error.message });
    }
};

exports.getProvider = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;

    try {
        const provider = await db.provider.findUnique({
            where: { id: id },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        if (!provider) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }

        res.status(200).json(provider);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar prestador', message: error.message });
    }
};

exports.listProvidersByCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { category } = req.params;

    try {
        const providers = await db.provider.findMany({
            where: {
                category: {
                    equals: category.toLowerCase(),
                },
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        if (providers.length === 0) {
            return res.status(404).json({ error: 'Nenhum prestador encontrado para esta categoria' });
        }

        res.status(200).json(providers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar prestadores', message: error.message });
    }
};

exports.listAllProviders = async (req, res) => {
    try {
        const providers = await db.provider.findMany({
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        res.status(200).json(providers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar prestadores', message: error.message });
    }
};

exports.updateProvider = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { category, bio } = req.body;
    const userId = req.user.id;

    try {
        const provider = await db.provider.findUnique({ where: { id: id } });
        if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

        if (provider.userId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Você não tem permissão para atualizar este prestador' });
        }

        const updated = await db.provider.update({
            where: { id: id },
            data: {
                category: category || undefined,
                bio: bio || undefined,
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar prestador', message: error.message });
    }
};

exports.deleteProvider = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.id;

    try {
        const provider = await db.provider.findUnique({ where: { id: id } });
        if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

        if (provider.userId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Você não tem permissão para deletar este prestador' });
        }

        await db.provider.delete({ where: { id: id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar prestador', message: error.message });
    }
};
