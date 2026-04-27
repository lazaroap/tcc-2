const db = require('../config/database');

async function checkMembership(userId, groupId) {
    return db.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
}

async function isGroupAdmin(userId, groupId) {
    const membership = await checkMembership(userId, groupId);
    return membership?.role === 'ADMIN';
}

async function requireMembership(userId, groupId) {
    const membership = await checkMembership(userId, groupId);
    if (!membership) {
        const err = new Error('Você não é membro deste grupo');
        err.status = 403;
        throw err;
    }
    return membership;
}

module.exports = { checkMembership, isGroupAdmin, requireMembership };
