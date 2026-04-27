const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

exports.createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    const group = await db.group.create({
        data: {
            name,
            description: description || null,
            ownerId,
            members: { create: { userId: ownerId, role: 'ADMIN' } },
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
    });

    res.status(201).json(group);
});

exports.getGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: id } },
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
        return res.status(403).json({ error: 'Acesso negado. Voce não é membro deste grupo.' });
    }

    res.status(200).json(membership.group);
});

exports.getMyGroups = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = { members: { some: { userId } } };

    const [groups, total] = await Promise.all([
        db.group.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true } },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.group.count({ where }),
    ]);

    res.status(200).json({
        groups,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.getGroups = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const where = search
        ? {
              OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }],
          }
        : {};

    const [groups, total] = await Promise.all([
        db.group.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true } },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.group.count({ where }),
    ]);

    res.status(200).json({
        groups,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

exports.updateGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const group = await db.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Apenas o dono do grupo pode atualizá-lo' });
    }

    const updated = await db.group.update({
        where: { id },
        data: {
            name: name || group.name,
            description: description !== undefined ? description : group.description,
        },
    });

    res.status(200).json(updated);
});

exports.deleteGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const group = await db.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Apenas o dono do grupo pode deletá-lo' });
    }

    await db.group.delete({ where: { id } });
    res.status(200).json({ message: 'Grupo deletado com sucesso' });
});

exports.addMember = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const { userId, role } = req.body;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Apenas o dono do grupo pode adicionar membros' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const membership = await db.groupMember.create({
        data: { groupId, userId, role: role || 'MEMBER' },
    });

    res.status(201).json(membership);
});

exports.removeMember = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const memberId = req.params.memberId;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Apenas o dono do grupo pode remover membros' });
    }

    await db.groupMember.delete({
        where: { userId_groupId: { userId: memberId, groupId } },
    });

    res.status(200).json({ message: 'Membro removido com sucesso' });
});

exports.leaveGroup = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const userId = req.user.id;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    if (group.ownerId === userId) {
        return res.status(400).json({ error: 'O dono não pode sair do grupo. Transfira a propriedade antes.' });
    }

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) return res.status(404).json({ error: 'Voce não e membro deste grupo' });

    await db.groupMember.delete({
        where: { userId_groupId: { userId, groupId } },
    });

    res.status(200).json({ message: 'Você saiu do grupo' });
});

exports.transferOwnership = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const { newOwnerId } = req.body;
    const userId = req.user.id;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.ownerId !== userId) {
        return res.status(403).json({ error: 'Apenas o dono pode transferir a propriedade' });
    }

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId: newOwnerId, groupId } },
    });
    if (!membership) {
        return res.status(400).json({ error: 'O novo dono precisa ser membro do grupo' });
    }

    await db.$transaction([
        db.group.update({ where: { id: groupId }, data: { ownerId: newOwnerId } }),
        db.groupMember.update({
            where: { userId_groupId: { userId: newOwnerId, groupId } },
            data: { role: 'ADMIN' },
        }),
    ]);

    res.status(200).json({ message: 'Transferência com sucesso' });
});
