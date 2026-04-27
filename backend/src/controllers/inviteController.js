const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('./notificationController');

exports.sendInvite = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const { email } = req.body;
    const senderId = req.user.id;

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    const senderMembership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId: senderId, groupId } },
    });
    if (!senderMembership) {
        return res.status(403).json({ error: 'Voce não e membro deste grupo' });
    }

    const receiver = await db.user.findUnique({ where: { email } });
    if (!receiver) {
        return res.status(404).json({ error: 'Nenhum usuário encontrado com este email' });
    }

    if (receiver.id === senderId) {
        return res.status(400).json({ error: 'Voce não pode convidar a si mesmo' });
    }

    const existingMember = await db.groupMember.findUnique({
        where: { userId_groupId: { userId: receiver.id, groupId } },
    });
    if (existingMember) {
        return res.status(400).json({ error: 'Este usuário ja é membro do grupo' });
    }

    const existingInvite = await db.groupInvite.findUnique({
        where: { groupId_receiverId: { groupId, receiverId: receiver.id } },
    });
    if (existingInvite && existingInvite.status === 'PENDING') {
        return res.status(400).json({ error: 'Já existe um convite pendente para este usuário' });
    }

    const invite = await db.groupInvite.upsert({
        where: { groupId_receiverId: { groupId, receiverId: receiver.id } },
        update: { status: 'PENDING', senderId },
        create: { groupId, senderId, receiverId: receiver.id },
        include: {
            receiver: { select: { id: true, name: true, email: true } },
            group: { select: { id: true, name: true } },
        },
    });

    const sender = await db.user.findUnique({ where: { id: senderId }, select: { name: true } });
    await createNotification(receiver.id, 'INVITE_RECEIVED', `${sender.name} convidou voce para o grupo "${group.name}"`, invite.id);

    res.status(201).json(invite);
});

exports.getMyInvites = asyncHandler(async (req, res) => {
    const invites = await db.groupInvite.findMany({
        where: { receiverId: req.user.id, status: 'PENDING' },
        include: {
            group: { select: { id: true, name: true, description: true } },
            sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ invites });
});

exports.acceptInvite = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invite = await db.groupInvite.findUnique({ where: { id } });
    if (!invite) return res.status(404).json({ error: 'Convite não encontrado' });
    if (invite.receiverId !== userId) return res.status(403).json({ error: 'Este convite nao e seu' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: 'Convite já foi respondido' });

    const [updatedInvite] = await db.$transaction([
        db.groupInvite.update({
            where: { id },
            data: { status: 'ACCEPTED' },
            include: { group: { select: { id: true, name: true } } },
        }),
        db.groupMember.create({
            data: { groupId: invite.groupId, userId, role: 'MEMBER' },
        }),
    ]);

    const receiver = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(
        invite.senderId,
        'INVITE_ACCEPTED',
        `${receiver.name} aceitou seu convite para o grupo "${updatedInvite.group.name}"`,
        invite.id
    );

    res.status(200).json({ message: 'Convite aceito! Você agora é membro do grupo.', invite: updatedInvite });
});

exports.rejectInvite = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invite = await db.groupInvite.findUnique({ where: { id } });
    if (!invite) return res.status(404).json({ error: 'Convite não encontrado' });
    if (invite.receiverId !== userId) return res.status(403).json({ error: 'Este convite não é seu' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: 'Convite já foi respondido' });

    const updatedInvite = await db.groupInvite.update({
        where: { id },
        data: { status: 'REJECTED' },
    });

    res.status(200).json({ message: 'Convite recusado.', invite: updatedInvite });
});

exports.getGroupInvites = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const membership = await db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) return res.status(403).json({ error: 'Você não é membro deste grupo' });

    const invites = await db.groupInvite.findMany({
        where: { groupId, status: 'PENDING' },
        include: {
            receiver: { select: { id: true, name: true, email: true } },
            sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ invites });
});
