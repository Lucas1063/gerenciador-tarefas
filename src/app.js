'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { createTaskStore, ValidationError } = require('./taskStore');

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function createApp({ store = createTaskStore(), version = process.env.APP_VERSION || 'dev' } = {}) {
  const app = express();

  // RNF-01: cabeçalhos de segurança. upgrade-insecure-requests desativado porque
  // a aplicação é servida em HTTP puro na EC2 (sem certificado).
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': null } },
    }),
  );

  // RNF-02: limite de corpo
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // RF-07
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // RF-08
  app.get('/api/version', (_req, res) => res.json({ version }));

  // RF-01
  app.get('/api/tasks', (_req, res) => res.json(store.list()));

  // RF-02, RF-03
  app.post('/api/tasks', (req, res) => {
    const task = store.create(req.body?.title);
    res.status(201).json(task);
  });

  // RF-04, RF-06
  app.patch('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id);
    const task = id && store.setDone(id, req.body?.done);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    return res.json(task);
  });

  // RF-05, RF-06
  app.delete('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (!id || !store.remove(id)) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    return res.status(204).end();
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

  // RF-03, RNF-02: erros de validação e JSON malformado
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      return res.status(400).json({ error: 'Corpo da requisição inválido.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  });

  return app;
}

module.exports = { createApp };
