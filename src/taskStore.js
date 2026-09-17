'use strict';

// Regras de negócio e armazenamento em memória (RF-01..RF-06)
const TITLE_MIN = 3;
const TITLE_MAX = 100;

class ValidationError extends Error {}

function createTaskStore() {
  let tasks = [];
  let nextId = 1;

  function validateTitle(title) {
    if (typeof title !== 'string') {
      throw new ValidationError('O campo "title" é obrigatório e deve ser texto.');
    }
    const clean = title.trim();
    if (clean.length < TITLE_MIN || clean.length > TITLE_MAX) {
      throw new ValidationError(`O título deve ter entre ${TITLE_MIN} e ${TITLE_MAX} caracteres.`);
    }
    return clean;
  }

  return {
    list() {
      return tasks.map((t) => ({ ...t }));
    },

    create(title) {
      const task = {
        id: nextId++,
        title: validateTitle(title),
        done: false,
        createdAt: new Date().toISOString(),
      };
      tasks.push(task);
      return { ...task };
    },

    setDone(id, done) {
      if (typeof done !== 'boolean') {
        throw new ValidationError('O campo "done" deve ser true ou false.');
      }
      const task = tasks.find((t) => t.id === id);
      if (!task) return null;
      task.done = done;
      return { ...task };
    },

    remove(id) {
      const before = tasks.length;
      tasks = tasks.filter((t) => t.id !== id);
      return tasks.length < before;
    },
  };
}

module.exports = { createTaskStore, ValidationError, TITLE_MIN, TITLE_MAX };
