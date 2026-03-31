import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /health returns server health payload', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'FindOne server is running');
  assert.equal(response.body.data.environment, 'development');
});

test('GET /api/v1 returns API version metadata', async () => {
  const response = await request(app).get('/api/v1');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.version, 'v1');
});

test('GET /api/v1/auth/me without token returns 401', async () => {
  const response = await request(app).get('/api/v1/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('POST /api/v1/auth/register validates payload before controller logic', async () => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      fullName: 'A',
      email: 'not-an-email',
      password: '123',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Validation failed');
  assert.ok(Array.isArray(response.body.errors));
});

test('POST /api/v1/jobs validates required fields', async () => {
  const response = await request(app)
    .post('/api/v1/jobs')
    .send({
      title: 'Hi',
    });

  assert.equal(response.status, 401);
});
