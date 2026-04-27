const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

async function createNotification(userId, type, message, resourceId = null) {
    return db.notification.create({
        data: { userId, type, message, resourceId },
    });
}

const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        db.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.notification.count({ where: { userId } }),
        db.notification.count({ where: { userId, read: false } }),
    ]);

    res.status(200).json({
        notifications,
        unreadCount,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
    if (notification.userId !== userId) return res.status(403).json({ error: 'Sem permissao' });

    const updated = await db.notification.update({
        where: { id },
        data: { read: true },
    });

    res.status(200).json(updated);
});

const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });

    res.status(200).json({ message: 'Todas as notificações foram marcadas como lidas' });
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await db.notification.count({
        where: { userId: req.user.id, read: false },
    });

    res.status(200).json({ unreadCount: count });
});

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
};
