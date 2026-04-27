const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let user1, user2, outsider, groupId, providerId, recId, externalRecId;

beforeAll(async () => {
  await cleanDatabase();
  user1 = await createTestUser({ name: 'Rec User 1' });
  user2 = await createTestUser({ name: 'Rec User 2' });
  outsider = await createTestUser({ name: 'Outsider' });

  // Criar provider
  const provRes = await request(app)
    .post('/api/providers')
    .set('Authorization', authHeader(user2.token))
    .send({ category: 'eletricista' });
  providerId = provRes.body.id;

  // Criar grupo com user1 como dono
  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', authHeader(user1.token))
    .send({ name: 'Grupo Recs' });
  groupId = groupRes.body.id;

  // Adicionar user2 ao grupo
  await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set('Authorization', authHeader(user1.token))
    .send({ userId: user2.user.id });
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/groups/:groupId/recommendations', () => {
  it('deve criar recomendacao com provider cadastrado', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token))
      .send({ title: 'Otimo eletricista', description: 'Recomendo muito', providerId });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Otimo eletricista');
    expect(res.body.providerId).toBe(providerId);
    expect(res.body.authorId).toBe(user1.user.id);
    recId = res.body.id;
  });

  it('deve criar recomendacao com provider externo', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token))
      .send({
        title: 'Pintor externo',
        externalName: 'Ze Pintor',
        externalCategory: 'pintor',
        externalPhone: '11999999999',
      });

    expect(res.status).toBe(201);
    expect(res.body.externalName).toBe('Ze Pintor');
    expect(res.body.externalPhone).toBe('11999999999');
    expect(res.body.providerId).toBeNull();
    externalRecId = res.body.id;
  });

  it('deve rejeitar sem provider e sem dados externos', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token))
      .send({ title: 'Sem provider' });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar para nao membro do grupo', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(outsider.token))
      .send({ title: 'Tentativa', providerId });

    expect(res.status).toBe(403);
  });

  it('deve rejeitar externo sem telefone', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token))
      .send({ title: 'Sem telefone', externalName: 'Alguem' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/telefone/i);
  });
});

describe('GET /api/groups/:groupId/recommendations', () => {
  it('deve listar recomendacoes do grupo', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeInstanceOf(Array);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(res.body).toHaveProperty('pagination');

    // Deve ter upvotes/downvotes/score
    const rec = res.body.recommendations[0];
    expect(rec).toHaveProperty('upvotes');
    expect(rec).toHaveProperty('downvotes');
    expect(rec).toHaveProperty('score');
  });

  it('deve rejeitar para nao membro', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(outsider.token));

    expect(res.status).toBe(403);
  });
});

describe('Votos em recomendacoes', () => {
  it('deve fazer upvote', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${recId}/vote`)
      .set('Authorization', authHeader(user1.token))
      .send({ type: 'UP' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('UP');
  });

  it('deve mudar para downvote', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${recId}/vote`)
      .set('Authorization', authHeader(user1.token))
      .send({ type: 'DOWN' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('DOWN');
  });

  it('deve verificar score na listagem', async () => {
    // user2 tambem vota UP
    await request(app)
      .post(`/api/recommendations/${recId}/vote`)
      .set('Authorization', authHeader(user2.token))
      .send({ type: 'UP' });

    const res = await request(app)
      .get(`/api/groups/${groupId}/recommendations`)
      .set('Authorization', authHeader(user1.token));

    const rec = res.body.recommendations.find((r) => r.id === recId);
    expect(rec.upvotes).toBe(1); // user2 UP
    expect(rec.downvotes).toBe(1); // user1 DOWN
    expect(rec.score).toBe(0);
  });

  it('deve remover voto', async () => {
    const res = await request(app)
      .delete(`/api/recommendations/${recId}/vote`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(204);
  });

  it('deve rejeitar voto de nao membro', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${recId}/vote`)
      .set('Authorization', authHeader(outsider.token))
      .send({ type: 'UP' });

    expect(res.status).toBe(403);
  });
});

describe('Comentarios em recomendacoes', () => {
  let commentId;

  it('deve adicionar comentario', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${recId}/comments`)
      .set('Authorization', authHeader(user2.token))
      .send({ content: 'Concordo!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Concordo!');
    commentId = res.body.id;
  });

  it('deve listar comentarios', async () => {
    const res = await request(app)
      .get(`/api/recommendations/${recId}/comments`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.comments).toBeInstanceOf(Array);
    expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
  });

  it('deve editar proprio comentario', async () => {
    const res = await request(app)
      .put(`/api/recommendations/comments/${commentId}`)
      .set('Authorization', authHeader(user2.token))
      .send({ content: 'Concordo muito!' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Concordo muito!');
  });

  it('deve rejeitar edicao por outro usuario', async () => {
    const res = await request(app)
      .put(`/api/recommendations/comments/${commentId}`)
      .set('Authorization', authHeader(user1.token))
      .send({ content: 'Hacked' });

    expect(res.status).toBe(403);
  });

  it('deve deletar proprio comentario', async () => {
    const res = await request(app)
      .delete(`/api/recommendations/comments/${commentId}`)
      .set('Authorization', authHeader(user2.token));

    expect(res.status).toBe(204);
  });
});

describe('DELETE /api/recommendations/:id', () => {
  it('deve rejeitar exclusao por nao autor', async () => {
    const res = await request(app)
      .delete(`/api/recommendations/${recId}`)
      .set('Authorization', authHeader(outsider.token));

    expect(res.status).toBe(403);
  });

  it('deve deletar recomendacao pelo autor', async () => {
    const res = await request(app)
      .delete(`/api/recommendations/${recId}`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(204);
  });

  it('deve deletar recomendacao externa', async () => {
    const res = await request(app)
      .delete(`/api/recommendations/${externalRecId}`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(204);
  });
});

describe('Pedidos de recomendacao', () => {
  let requestId;

  it('deve criar pedido de recomendacao', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/requests`)
      .set('Authorization', authHeader(user1.token))
      .send({ title: 'Preciso de um encanador', category: 'encanador' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Preciso de um encanador');
    requestId = res.body.id;
  });

  it('deve listar pedidos do grupo', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/requests`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeInstanceOf(Array);
    expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
  });

  it('deve adicionar resposta ao pedido', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/replies`)
      .set('Authorization', authHeader(user2.token))
      .send({ content: 'Conhego um otimo encanador!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Conhego um otimo encanador!');
  });

  it('deve marcar pedido como resolvido', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/resolve`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(200);
    expect(res.body.resolved).toBe(true);
  });

  it('deve rejeitar resposta em pedido resolvido', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/replies`)
      .set('Authorization', authHeader(user2.token))
      .send({ content: 'Tarde demais' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resolvido/i);
  });

  it('deve deletar pedido pelo autor', async () => {
    const res = await request(app)
      .delete(`/api/requests/${requestId}`)
      .set('Authorization', authHeader(user1.token));

    expect(res.status).toBe(204);
  });
});
