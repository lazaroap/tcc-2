const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let user1, user2;

beforeAll(async () => {
  await cleanDatabase();
  user1 = await createTestUser({ name: 'User One' });
  user2 = await createTestUser({ name: 'User Two' });
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('GET /api/users/me', () => {
  it('deve retornar o perfil do usuario logado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user1.user.id);
    expect(res.body.name).toBe('User One');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('refreshToken');
  });

  it('deve rejeitar sem autenticacao', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {
  it('deve listar usuarios com paginacao', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    // Nao deve expor senha
    res.body.users.forEach((u) => {
      expect(u).not.toHaveProperty('password');
    });
  });
});

describe('GET /api/users/:id', () => {
  it('deve retornar usuario por ID', async () => {
    const res = await request(app)
      .get(`/api/users/${user1.user.id}`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user1.user.id);
  });

  it('deve retornar 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/users/id_inexistente_xyz')
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id', () => {
  it('deve atualizar o proprio perfil', async () => {
    const res = await request(app)
      .put(`/api/users/${user1.user.id}`)
      .set('Authorization', authHeader(user1.token))
      .send({ name: 'User One Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('User One Updated');
  });

  it('deve rejeitar atualizacao de outro usuario', async () => {
    const res = await request(app)
      .put(`/api/users/${user1.user.id}`)
      .set('Authorization', authHeader(user2.token))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deve rejeitar exclusao de outro usuario', async () => {
    const res = await request(app)
      .delete(`/api/users/${user1.user.id}`)
      .set('Authorization', authHeader(user2.token));

    expect(res.status).toBe(403);
  });

  it('deve deletar o proprio usuario', async () => {
    const tempUser = await createTestUser({ name: 'ToDelete' });

    const res = await request(app)
      .delete(`/api/users/${tempUser.user.id}`)
      .set('Authorization', authHeader(tempUser.token));

    expect(res.status).toBe(204);
  });
});
