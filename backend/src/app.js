const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const app = express();

const userRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const groupRouter = require('./routes/groupRouter');
const providerRouter = require('./routes/providerRouter');
const reviewRouter = require('./routes/reviewRouter');
const recommendationRouter = require('./routes/recommendationRouter');
const inviteRouter = require('./routes/inviteRouter');
const joinRequestRouter = require('./routes/joinRequestRouter');
const notificationRouter = require('./routes/notificationRouter');
const uploadRouter = require('./routes/uploadRouter');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json({ limit: '1mb' }));

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET' || process.env.NODE_ENV === 'test',
});
app.use('/api', writeLimiter);

app.use('/api', userRouter);
app.use('/api/auth', authRouter);
app.use('/api', groupRouter);
app.use('/api', providerRouter);
app.use('/api', reviewRouter);
app.use('/api', recommendationRouter);
app.use('/api', inviteRouter);
app.use('/api', joinRequestRouter);
app.use('/api', notificationRouter);
app.use('/api', uploadRouter);

app.get('/', (req, res) => {
    res.json({ message: 'API ConectaServ rodando' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const payload = {
        error: err.message || 'Erro interno do servidor',
        status,
    };
    if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
    res.status(status).json(payload);
});

module.exports = app;
