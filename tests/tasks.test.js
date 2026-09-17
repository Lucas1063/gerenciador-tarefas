'use strict';

// Cada teste cita o critério de aceitação (CA) e o requisito (RF/RNF) da spec.
const request = require('supertest');
const { createApp } = require('../src/app');

let app;

beforeEach(() => {
  app = createApp({ version: 'teste-123' });
});

describe('RF-07 / RF-08 — operação', () => {
  test('CA-08: /health responde status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('RF-08: /api/version retorna a versão publicada', async () => {
    const res = await request(app).get('/api/version');
    expect(res.body).toEqual({ version: 'teste-123' });
  });

  test('RNF-01: cabeçalhos de segurança presentes e X-Powered-By ausente', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('RF-09: página inicial é servida', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Tarefas do semestre');
  });
});

describe('RF-01..RF-03 — criar e listar', () => {
  test('CA-01: cria tarefa com título válido', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '  Estudar SDD  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Estudar SDD', done: false });
    expect(res.body.createdAt).toBeDefined();
  });

  test('RF-01: lista tarefas em ordem de criação', async () => {
    await request(app).post('/api/tasks').send({ title: 'Primeira' });
    await request(app).post('/api/tasks').send({ title: 'Segunda' });
    const res = await request(app).get('/api/tasks');
    expect(res.body.map((t) => t.title)).toEqual(['Primeira', 'Segunda']);
  });

  test('CA-02: título curto retorna 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'ab' });
    expect(res.status).toBe(400);
  });

  test('RF-03: título acima de 100 caracteres retorna 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x'.repeat(101) });
    expect(res.status).toBe(400);
  });

  test('CA-03: corpo sem título retorna 400', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });
});

describe('RF-04..RF-06 — concluir e excluir', () => {
  test('CA-04: marca tarefa como concluída', async () => {
    await request(app).post('/api/tasks').send({ title: 'Fazer deploy' });
    const res = await request(app).patch('/api/tasks/1').send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test('CA-05: done não booleano retorna 400', async () => {
    await request(app).post('/api/tasks').send({ title: 'Fazer deploy' });
    const res = await request(app).patch('/api/tasks/1').send({ done: 'sim' });
    expect(res.status).toBe(400);
  });

  test('CA-06: exclui tarefa', async () => {
    await request(app).post('/api/tasks').send({ title: 'Apagar depois' });
    const del = await request(app).delete('/api/tasks/1');
    expect(del.status).toBe(204);
    const list = await request(app).get('/api/tasks');
    expect(list.body).toEqual([]);
  });

  test.each([
    ['patch', '/api/tasks/999', { done: true }],
    ['delete', '/api/tasks/999', undefined],
    ['patch', '/api/tasks/abc', { done: true }],
    ['delete', '/api/tasks/abc', undefined],
  ])('CA-07: %s em %s retorna 404', async (method, url, body) => {
    const res = await request(app)[method](url).send(body);
    expect(res.status).toBe(404);
  });
});

describe('RNF-02 — robustez', () => {
  test('CA-09: JSON malformado retorna 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": ');
    expect(res.status).toBe(400);
  });

  test('RNF-02: corpo acima de 10 kB retorna 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x'.repeat(20000) });
    expect(res.status).toBe(400);
  });

  test('rota de API inexistente retorna 404', async () => {
    const res = await request(app).get('/api/nada');
    expect(res.status).toBe(404);
  });
});
