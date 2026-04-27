const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');

exports.handleUpload = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Imagem muito grande. Maximo 2MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

exports.uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const user = await db.user.findUnique({ where: { id: req.user.id }, select: { avatar: true } });
    if (user?.avatar) {
        const oldPath = path.join(__dirname, '..', '..', 'uploads', path.basename(user.avatar));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    await db.user.update({
        where: { id: req.user.id },
        data: { avatar: avatarUrl },
    });

    res.json({ avatar: avatarUrl });
});
