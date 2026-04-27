const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let providerUser, reviewerUser, notificationId;

beforeAll(async () => {
  await cleanDatabase();
  providerUser = await createTestUser({ name: 'Notif Provider' });
  reviewerUser = await createTestUser({ name: 'Notif Reviewer' });

  // Criar provider para gerar notificacao via review
  const provRes = await request(app)
    .post('/api/providers')
    .set('Authorization', authHeader(providerUser.token))
    .send({ category: 'eletricista' });

  // Criar review (gera notificacao NEW_REVIEW para o provider)
  await request(app)
    .post(`/api/providers/${provRes.body.id}/reviews`)
    .set('Authorization', authHeader(reviewerUser.token))
    .send({ rating: 5, comment: 'Otimo!' });
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('GET /api/notifications', () => {
  it('deve listar notificacoes do usuario', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader(providerUser.token));

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeInstanceOf(Array);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('unreadCount');
    expect(res.body).toHaveProperty('pagination');

    // Guardar ID para testes seguintes
    notificationId = res.body.notifications[0].id;
  });

  it('deve retornar lista vazia para usuario sem notificacoes', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader(reviewerUser.token));

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
  });
});

describe('GET /api/notifications/unread-count', () => {
  it('deve retornar contagem de nao lidas', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', authHeader(providerUser.token));

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  it('deve marcar notificacao como lida', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set('Authorization', authHeader(providerUser.token));

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('deve rejeitar para outro usuario', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set('Authorization', authHeader(reviewerUser.token));

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/notifications/read-all', () => {
  beforeAll(async () => {
    // Criar mais notificacoes para testar mark-all
    const provider = await db.provider.findUnique({ where: { userId: providerUser.user.id } });
    const otherUser = await createTestUser({ name: 'Another Reviewer' });
    await request(app)
      .post(`/api/providers/${provider.id}/reviews`)
      .set('Authorization', authHeader(otherUser.token))
      .send({ rating: 4 });
  });

  it('deve marcar todas como lidas', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', authHeader(providerUser.token));

    expect(res.status).toBe(200);

    // Verificar que todas foram marcadas
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', authHeader(providerUser.token));

    expect(countRes.body.unreadCount).toBe(0);
  });
});
