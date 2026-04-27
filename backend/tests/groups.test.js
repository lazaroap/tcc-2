const request = require('supertest');
const { app, db, cleanDatabase, createTestUser, authHeader } = require('./helpers');

let owner, member, outsider, groupId;

beforeAll(async () => {
  await cleanDatabase();
  owner = await createTestUser({ name: 'Group Owner' });
  member = await createTestUser({ name: 'Group Member' });
  outsider = await createTestUser({ name: 'Outsider' });
});

afterAll(async () => {
  await cleanDatabase();
  await db.$disconnect();
});

describe('POST /api/groups', () => {
  it('deve criar um grupo', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(owner.token))
      .send({ name: 'Grupo Teste', description: 'Descricao do grupo' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Grupo Teste');
    expect(res.body.ownerId).toBe(owner.user.id);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].role).toBe('ADMIN');
    groupId = res.body.id;
  });

  it('deve rejeitar sem nome', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', authHeader(owner.token))
      .send({ description: 'Sem nome' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/groups/me', () => {
  it('deve listar grupos do usuario', async () => {
    const res = await request(app)
      .get('/api/groups/me')
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(200);
    expect(res.body.groups).toBeInstanceOf(Array);
    expect(res.body.groups.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/groups/:id', () => {
  it('deve retornar grupo para membro', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(groupId);
  });

  it('deve rejeitar acesso de nao membro', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(outsider.token));

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/groups/:id', () => {
  it('deve atualizar grupo pelo dono', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(owner.token))
      .send({ name: 'Grupo Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Grupo Atualizado');
  });

  it('deve rejeitar atualizacao por nao dono', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(outsider.token))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/groups/:id/members', () => {
  it('deve adicionar membro ao grupo', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', authHeader(owner.token))
      .send({ userId: member.user.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(member.user.id);
    expect(res.body.role).toBe('MEMBER');
  });

  it('deve rejeitar adicao por nao dono', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', authHeader(member.token))
      .send({ userId: outsider.user.id });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/groups/:id/leave', () => {
  it('deve permitir membro sair do grupo', async () => {
    const tempMember = await createTestUser({ name: 'Temp Member' });
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', authHeader(owner.token))
      .send({ userId: tempMember.user.id });

    const res = await request(app)
      .delete(`/api/groups/${groupId}/leave`)
      .set('Authorization', authHeader(tempMember.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/saiu/i);
  });

  it('deve impedir o dono de sair', async () => {
    const res = await request(app)
      .delete(`/api/groups/${groupId}/leave`)
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dono/i);
  });
});

describe('PUT /api/groups/:id/transfer', () => {
  it('deve transferir propriedade', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}/transfer`)
      .set('Authorization', authHeader(owner.token))
      .send({ newOwnerId: member.user.id });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/transferida/i);
  });

  it('deve rejeitar transferencia por nao dono', async () => {
    // Agora member e o dono, owner nao e mais
    const res = await request(app)
      .put(`/api/groups/${groupId}/transfer`)
      .set('Authorization', authHeader(owner.token))
      .send({ newOwnerId: outsider.user.id });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/groups/:id/members/:memberId', () => {
  it('deve remover membro pelo dono', async () => {
    // member agora e o dono (apos transfer). Vamos adicionar owner como membro e remove-lo
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', authHeader(member.token))
      .send({ userId: outsider.user.id });

    const res = await request(app)
      .delete(`/api/groups/${groupId}/members/${outsider.user.id}`)
      .set('Authorization', authHeader(member.token));

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/groups/:id', () => {
  it('deve rejeitar exclusao por nao dono', async () => {
    const res = await request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(owner.token));

    expect(res.status).toBe(403);
  });

  it('deve deletar grupo pelo dono', async () => {
    // member e o dono apos transfer
    const res = await request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', authHeader(member.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deletado/i);
  });
});
