const db = require('../config/database');
const { validationResult } = require('express-validator');

exports.createGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const ownerId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
    }

    try {
        const group = await db.group.create({
            data: {
                name,
                description: description || null,
                ownerId,
                members: {
                    create: {
                        userId: ownerId,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
        });

        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar grupo', message: error.message });
    }
};

exports.getGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.id;

    try {
        const membership = await db.groupMember.findUnique({
            where: {
                userId_groupId: { userId, groupId: id },
            },
            include: {
                group: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                        members: {
                            include: { user: { select: { id: true, name: true, email: true } } },
                        },
                    },
                },
            },
        });

        if (!membership) {
            return res.status(403).json({ error: 'Acesso negado. Você não é membro deste grupo.' });
        }

        res.status(200).json(membership.group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar grupo', message: error.message });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const groups = await db.group.findMany();
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar grupos', message: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const name = req.body?.name;
    const description = req.body?.description;
    const userId = req.user.id;

    try {
        const group = await db.group.findUnique({
            where: { id: id },
        });

        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }

        if (group.ownerId !== userId) {
            return res.status(403).json({ error: 'Apenas o dono do grupo pode atualizá-lo' });
        }

        const updatedGroup = await db.group.update({
            where: { id: id },
            data: {
                name: name || group.name,
                description: description !== undefined ? description : group.description,
            },
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar grupo', message: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.id;

    try {
        const group = await db.group.findUnique({
            where: { id: id },
        });

        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }

        if (group.ownerId !== userId) {
            return res.status(403).json({ error: 'Apenas o dono do grupo pode deletá-lo' });
        }

        await db.group.delete({
            where: { id: id },
        });

        res.status(200).json({ message: 'Grupo deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar grupo', message: error.message });
    }
};

exports.addMember = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { groupId, userId, role } = req.body;
    const requesterId = req.user.id;

    try {
        const group = await db.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }

        if (group.ownerId !== requesterId) {
            return res.status(403).json({ error: 'Apenas o dono do grupo pode adicionar membros' });
        }

        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const membership = await db.groupMember.create({
            data: {
                groupId: groupId,
                userId: userId,
                role: role || 'MEMBER',
            },
        });

        res.status(201).json(membership);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Erro ao adicionar membro ao grupo',
            message: error.message,
        });
    }
};

exports.removeMember = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { groupId, userId } = req.body;
    const requesterId = req.user.id;

    try {
        const group = await db.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }

        if (group.ownerId !== requesterId) {
            return res.status(403).json({ error: 'Apenas o dono do grupo pode remover membros' });
        }

        await db.groupMember.delete({
            where: {
                userId_groupId: {
                    userId: userId,
                    groupId: groupId,
                },
            },
        });

        res.status(200).json({ message: 'Membro removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover membro do grupo', message: error.message });
    }
};
