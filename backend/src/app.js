const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();

const userRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const groupRouter = require('./routes/groupRouter');
const providerRouter = require('./routes/providerRouter');

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api', userRouter);
app.use('/api/auth', authRouter);
app.use('/api', groupRouter);
app.use('/api', providerRouter);

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
