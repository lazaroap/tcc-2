const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let owner, invitedUser, groupId, inviteId;

beforeAll(async () => {
  await cleanDatabase();
  owner = await createTestUser({ name: 'Invite Owner' });
  invitedUser = await createTestUser({ name: 'Invited User' });

  // Criar grupo
  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', authHeader(owner.token))
    .send({ name: 'Grupo Convites' });
  groupId = groupRes.body.id;
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/groups/:id/invites', () => {
  it('deve enviar convite', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token))
      .send({ email: invitedUser.email });

    expect(res.status).toBe(201);
    expect(res.body.receiver.email).toBe(invitedUser.email);
    inviteId = res.body.id;
  });

  it('deve rejeitar autoconvite', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token))
      .send({ email: owner.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/si mesmo/i);
  });

  it('deve rejeitar convite duplicado pendente', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token))
      .send({ email: invitedUser.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pendente/i);
  });

  it('deve rejeitar email inexistente', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token))
      .send({ email: 'naoexiste@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/invites/me', () => {
  it('deve listar convites do usuario', async () => {
    const res = await request(app)
      .get('/api/invites/me')
      .set('Authorization', authHeader(invitedUser.token));

    expect(res.status).toBe(200);
    expect(res.body.invites).toBeInstanceOf(Array);
    expect(res.body.invites.length).toBeGreaterThanOrEqual(1);
    expect(res.body.invites[0].group.name).toBe('Grupo Convites');
  });
});

describe('GET /api/groups/:id/invites', () => {
  it('deve listar convites pendentes do grupo', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(200);
    expect(res.body.invites).toBeInstanceOf(Array);
    expect(res.body.invites.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PUT /api/invites/:id/reject', () => {
  it('deve rejeitar convite de outro usuario', async () => {
    const res = await request(app)
      .put(`/api/invites/${inviteId}/reject`)
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/invites/:id/accept', () => {
  it('deve aceitar convite', async () => {
    const res = await request(app)
      .put(`/api/invites/${inviteId}/accept`)
      .set('Authorization', authHeader(invitedUser.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/aceito/i);

    // Verificar que usuario agora e membro
    const groupRes = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(invitedUser.token));

    expect(groupRes.status).toBe(200);
  });

  it('deve rejeitar convite ja respondido', async () => {
    const res = await request(app)
      .put(`/api/invites/${inviteId}/accept`)
      .set('Authorization', authHeader(invitedUser.token));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/respondido/i);
  });
});

describe('Rejeitar convite', () => {
  let rejectInviteId;
  let rejectUser;

  beforeAll(async () => {
    rejectUser = await createTestUser({ name: 'To Reject' });

    const res = await request(app)
      .post(`/api/groups/${groupId}/invites`)
      .set('Authorization', authHeader(owner.token))
      .send({ email: rejectUser.email });

    rejectInviteId = res.body.id;
  });

  it('deve rejeitar convite com sucesso', async () => {
    const res = await request(app)
      .put(`/api/invites/${rejectInviteId}/reject`)
      .set('Authorization', authHeader(rejectUser.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/recusado/i);
  });
});
