const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let user1, user2;

beforeAll(async () => {
  await cleanDatabase();
  user1 = await createTestUser({ name: 'Provider User' });
  user2 = await createTestUser({ name: 'Other User' });
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/providers', () => {
  it('deve criar um prestador', async () => {
    const res = await request(app)
      .post('/api/providers')
      .set('Authorization', authHeader(user1.token))
      .send({ category: 'eletricista', bio: 'Eletricista experiente' });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('eletricista');
    expect(res.body.bio).toBe('Eletricista experiente');
    expect(res.body.userId).toBe(user1.user.id);
  });

  it('deve rejeitar prestador duplicado', async () => {
    const res = await request(app)
      .post('/api/providers')
      .set('Authorization', authHeader(user1.token))
      .send({ category: 'encanador' });

    expect(res.status).toBe(409);
  });

  it('deve rejeitar categoria invalida', async () => {
    const res = await request(app)
      .post('/api/providers')
      .set('Authorization', authHeader(user2.token))
      .send({ category: 'categoria_invalida' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/providers/categories', () => {
  it('deve listar categorias validas', async () => {
    const res = await request(app).get('/api/providers/categories');

    expect(res.status).toBe(200);
    expect(res.body.categories).toBeInstanceOf(Array);
    expect(res.body.categories).toContain('eletricista');
  });
});

describe('GET /api/providers', () => {
  it('deve listar todos os prestadores', async () => {
    const res = await request(app).get('/api/providers');

    expect(res.status).toBe(200);
    expect(res.body.providers).toBeInstanceOf(Array);
    expect(res.body.providers.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('pagination');
  });

  it('deve filtrar por categoria', async () => {
    const res = await request(app).get('/api/providers?category=eletricista');

    expect(res.status).toBe(200);
    res.body.providers.forEach((p) => {
      expect(p.category).toBe('eletricista');
    });
  });
});

describe('GET /api/providers/search', () => {
  it('deve buscar prestadores por nome', async () => {
    const res = await request(app)
      .get('/api/providers/search?q=Provider')
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.providers).toBeInstanceOf(Array);
  });

  it('deve retornar vazio para busca curta (< 2 chars)', async () => {
    const res = await request(app)
      .get('/api/providers/search?q=P')
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.providers).toHaveLength(0);
  });
});

describe('GET /api/providers/:id', () => {
  let providerId;

  beforeAll(async () => {
    const provider = await db.provider.findUnique({ where: { userId: user1.user.id } });
    providerId = provider.id;
  });

  it('deve retornar prestador por ID', async () => {
    const res = await request(app).get(`/api/providers/${providerId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(providerId);
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('reviewCount');
  });

  it('deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/providers/id_inexistente');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/providers/:id/stats', () => {
  it('deve retornar estatisticas do prestador', async () => {
    const provider = await db.provider.findUnique({ where: { userId: user1.user.id } });

    const res = await request(app).get(`/api/providers/${provider.id}/stats`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('distribution');
    expect(res.body).toHaveProperty('reviewCount');
    expect(res.body).toHaveProperty('recommendationCount');
    expect(res.body).toHaveProperty('trend');
    expect(res.body.trend).toBeInstanceOf(Array);
  });
});

describe('PUT /api/providers/:id', () => {
  let providerId;

  beforeAll(async () => {
    const provider = await db.provider.findUnique({ where: { userId: user1.user.id } });
    providerId = provider.id;
  });

  it('deve atualizar o proprio prestador', async () => {
    const res = await request(app)
      .put(`/api/providers/${providerId}`)
      .set('Authorization', authHeader(user1.token))
      .send({ bio: 'Bio atualizada' });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('Bio atualizada');
  });

  it('deve rejeitar atualizacao por outro usuario', async () => {
    const res = await request(app)
      .put(`/api/providers/${providerId}`)
      .set('Authorization', authHeader(user2.token))
      .send({ bio: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/providers/:id', () => {
  it('deve rejeitar exclusao por outro usuario', async () => {
    const provider = await db.provider.findUnique({ where: { userId: user1.user.id } });

    const res = await request(app)
      .delete(`/api/providers/${provider.id}`)
      .set('Authorization', authHeader(user2.token));

    expect(res.status).toBe(403);
  });
});
