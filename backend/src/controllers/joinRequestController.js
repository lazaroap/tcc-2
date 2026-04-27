const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('./notificationController');

exports.requestJoin = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    const existingMember = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (existingMember) {
        return res.status(400).json({ error: 'Você já é membro deste grupo' });
    }

    const existing = await db.joinRequest.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (existing && existing.status === 'PENDING') {
        return res.status(400).json({ error: 'Você já tem uma solicitação pendente para este grupo' });
    }

    const joinRequest = await db.joinRequest.upsert({
        where: { userId_groupId: { userId, groupId } },
        update: { status: 'PENDING', message: message || null },
        create: { userId, groupId, message: message || null },
        include: {
            group: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
        },
    });

    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(group.ownerId, 'JOIN_REQUEST_RECEIVED', `${user.name} pediu para entrar no grupo "${group.name}"`, joinRequest.id);

    res.status(201).json(joinRequest);
});

exports.getGroupJoinRequests = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (!membership || (membership.role !== 'ADMIN' && group.ownerId !== userId)) {
        return res.status(403).json({ error: 'Apenas admins podem ver solicitações' });
    }

    const requests = await db.joinRequest.findMany({
        where: { groupId, status: 'PENDING' },
        include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ requests });
});

exports.getMyJoinRequests = asyncHandler(async (req, res) => {
    const requests = await db.joinRequest.findMany({
        where: { userId: req.user.id },
        include: {
            group: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ requests });
});

exports.acceptJoinRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const joinRequest = await db.joinRequest.findUnique({
        where: { id },
        include: { group: true },
    });
    if (!joinRequest) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (joinRequest.status !== 'PENDING') {
        return res.status(400).json({ error: 'Solicitação já foi respondida' });
    }

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: joinRequest.groupId } },
    });
    if (!membership || (membership.role !== 'ADMIN' && joinRequest.group.ownerId !== userId)) {
        return res.status(403).json({ error: 'Apenas admins podem aceitar solicitações' });
    }

    await db.$transaction([
        db.joinRequest.update({
            where: { id },
            data: { status: 'ACCEPTED' },
        }),
        db.groupMember.create({
            data: { groupId: joinRequest.groupId, userId: joinRequest.userId, role: 'MEMBER' },
        }),
    ]);

    await createNotification(
        joinRequest.userId,
        'JOIN_REQUEST_ACCEPTED',
        `Sua solicitação para entrar no grupo "${joinRequest.group.name}" foi aceita!`,
        joinRequest.id
    );

    res.status(200).json({ message: 'Solicitação aceita! Usuário agora é membro do grupo.' });
});

exports.rejectJoinRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const joinRequest = await db.joinRequest.findUnique({
        where: { id },
        include: { group: true },
    });
    if (!joinRequest) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (joinRequest.status !== 'PENDING') {
        return res.status(400).json({ error: 'Solicitação já foi respondida' });
    }

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: joinRequest.groupId } },
    });
    if (!membership || (membership.role !== 'ADMIN' && joinRequest.group.ownerId !== userId)) {
        return res.status(403).json({ error: 'Apenas admins podem recusar solicitações' });
    }

    await db.joinRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
    });

    await createNotification(
        joinRequest.userId,
        'JOIN_REQUEST_REJECTED',
        `Sua solicitação para entrar no grupo "${joinRequest.group.name}" foi recusada.`,
        joinRequest.id
    );

    res.status(200).json({ message: 'Solicitação recusada.' });
});
