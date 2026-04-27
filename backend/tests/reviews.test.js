const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let providerUser, reviewerUser, providerId;

beforeAll(async () => {
  await cleanDatabase();
  providerUser = await createTestUser({ name: 'Provider' });
  reviewerUser = await createTestUser({ name: 'Reviewer' });

  // Criar provider
  const provRes = await request(app)
    .post('/api/providers')
    .set('Authorization', authHeader(providerUser.token))
    .send({ category: 'encanador' });
  providerId = provRes.body.id;
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/providers/:providerId/reviews', () => {
  it('deve criar uma avaliacao', async () => {
    const res = await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', authHeader(reviewerUser.token))
      .send({ rating: 5, comment: 'Excelente servico!' });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Excelente servico!');
    expect(res.body.user.id).toBe(reviewerUser.user.id);
  });

  it('deve rejeitar autoavaliacao', async () => {
    const res = await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', authHeader(providerUser.token))
      .send({ rating: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/si mesmo/i);
  });

  it('deve rejeitar avaliacao duplicada', async () => {
    const res = await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', authHeader(reviewerUser.token))
      .send({ rating: 4 });

    expect(res.status).toBe(409);
  });

  it('deve rejeitar rating invalido', async () => {
    const other = await createTestUser({ name: 'Other Reviewer' });

    const res = await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', authHeader(other.token))
      .send({ rating: 6 });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar rating menor que 1', async () => {
    const other = await createTestUser({ name: 'Another Reviewer' });

    const res = await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', authHeader(other.token))
      .send({ rating: 0 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/groups/:groupId/reviews', () => {
  let groupId;

  beforeAll(async () => {
    // Criar grupo e adicionar reviewer como membro
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${providerUser.token}`)
      .send({ name: 'Grupo Reviews Test' });
    groupId = groupRes.body.id;
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${providerUser.token}`)
      .send({ userId: reviewerUser.user.id });

    // Criar review vinculada ao grupo
    const other = await createTestUser({ name: 'Reviewer Group' });
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${providerUser.token}`)
      .send({ userId: other.user.id });
    await request(app)
      .post(`/api/providers/${providerId}/reviews`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ rating: 5, comment: 'Excelente!', groupId });
  });

  it('deve listar avaliacoes do grupo', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/reviews`)
      .set('Authorization', `Bearer ${reviewerUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('reviewCount');
    expect(res.body).toHaveProperty('pagination');
  });

  it('deve rejeitar nao membro', async () => {
    const outsider = await createTestUser({ name: 'Outsider Review' });
    const res = await request(app)
      .get(`/api/groups/${groupId}/reviews`)
      .set('Authorization', `Bearer ${outsider.token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/providers/:providerId/reviews', () => {
  it('deve listar avaliacoes com media', async () => {
    const res = await request(app)
      .get(`/api/providers/${providerId}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('reviewCount');
    expect(res.body).toHaveProperty('pagination');
  });

  it('deve filtrar por rating', async () => {
    const res = await request(app)
      .get(`/api/providers/${providerId}/reviews?rating=5`);

    expect(res.status).toBe(200);
    res.body.reviews.forEach((r) => {
      expect(r.rating).toBe(5);
    });
  });

  it('deve retornar 404 para provider inexistente', async () => {
    const res = await request(app)
      .get('/api/providers/id_inexistente/reviews');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/reviews/:id', () => {
  let reviewId;

  beforeAll(async () => {
    const review = await db.review.findFirst({
      where: { userId: reviewerUser.user.id, providerId },
    });
    reviewId = review.id;
  });

  it('deve atualizar a propria avaliacao', async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', authHeader(reviewerUser.token))
      .send({ rating: 4, comment: 'Bom servico' });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Bom servico');
  });

  it('deve rejeitar edicao por outro usuario', async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', authHeader(providerUser.token))
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('deve rejeitar exclusao por outro usuario', async () => {
    const review = await db.review.findFirst({
      where: { userId: reviewerUser.user.id },
    });

    const res = await request(app)
      .delete(`/api/reviews/${review.id}`)
      .set('Authorization', authHeader(providerUser.token));

    expect(res.status).toBe(403);
  });

  it('deve deletar a propria avaliacao', async () => {
    const review = await db.review.findFirst({
      where: { userId: reviewerUser.user.id },
    });

    const res = await request(app)
      .delete(`/api/reviews/${review.id}`)
      .set('Authorization', authHeader(reviewerUser.token));

    expect(res.status).toBe(204);
  });
});
