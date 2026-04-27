const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

let emailCounter = 0;

const uniqueEmail = () => `test_${Date.now()}_${++emailCounter}@test.com`;

const cleanDatabase = async () => {
  const models = [
    'notification',
    'requestReply',
    'recommendationRequest',
    'recommendationComment',
    'recommendationVote',
    'recommendation',
    'groupInvite',
    'review',
    'groupMember',
    'group',
    'provider',
    'user',
  ];
  for (const model of models) {
    await db[model].deleteMany();
  }
};

const createTestUser = async (overrides = {}) => {
  const data = {
    name: overrides.name || 'Test User',
    email: overrides.email || uniqueEmail(),
    password: overrides.password || 'senha12345',
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(data);

  return {
    user: res.body.user,
    token: res.body.token,
    refreshToken: res.body.refreshToken,
    password: data.password,
    email: data.email,
  };
};

const authHeader = (token) => `Bearer ${token}`;

module.exports = { app, db, cleanDatabase, createTestUser, uniqueEmail, authHeader };
