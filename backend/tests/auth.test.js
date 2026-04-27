const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, uniqueEmail } = require('./helpers');

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('deve registrar um usuario com sucesso', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Joao', email: uniqueEmail(), password: 'senha12345' });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.name).toBe('Joao');
    expect(res.body.user.role).toBe('USER');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('deve rejeitar email duplicado', async () => {
    const email = uniqueEmail();
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'User1', email, password: 'senha12345' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User2', email, password: 'senha12345' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ja cadastrado/i);
  });

  it('deve rejeitar sem nome', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: 'senha12345' });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar senha curta (< 8 caracteres)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: uniqueEmail(), password: '123' });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar email invalido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'naoeemail', password: 'senha12345' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const email = `login_test_${Date.now()}@test.com`;
  const password = 'senha12345';

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email, password });
  });

  it('deve fazer login com sucesso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('USER');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('deve rejeitar email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@test.com', password });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciais/i);
  });

  it('deve rejeitar senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciais/i);
  });
});

describe('POST /api/auth/refresh', () => {
  let refreshToken;

  beforeAll(async () => {
    const user = await createTestUser();
    refreshToken = user.refreshToken;
  });

  it('deve renovar o token com sucesso', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    // Token rotation: antigo refresh token e invalidado no banco
    const user = await db.user.findFirst({ where: { refreshToken: res.body.refreshToken } });
    expect(user).not.toBeNull();
    refreshToken = res.body.refreshToken;
  });

  it('deve rejeitar refresh token invalido', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token_invalido' });

    expect(res.status).toBe(401);
  });

  it('deve rejeitar sem refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('deve fazer logout com sucesso', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logout/i);
  });

  it('deve rejeitar sem token', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(401);
  });
});
