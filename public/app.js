'use strict';

const lista = document.getElementById('lista');
const vazio = document.getElementById('vazio');
const resumo = document.getElementById('resumo');
const erro = document.getElementById('erro');
const form = document.getElementById('form-nova');
const campo = document.getElementById('titulo');

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha na requisição.');
  return data;
}

function mostrarErro(msg) {
  erro.textContent = msg;
  erro.hidden = !msg;
}

function renderizar(tarefas) {
  lista.replaceChildren();
  for (const t of tarefas) {
    const li = document.createElement('li');
    li.className = t.done ? 'feita' : '';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.id = `t-${t.id}`;
    check.checked = t.done;
    check.addEventListener('change', () => alterar(t.id, check.checked));

    const label = document.createElement('label');
    label.htmlFor = check.id;
    label.textContent = t.title; // textContent evita XSS

    const excluir = document.createElement('button');
    excluir.className = 'excluir';
    excluir.type = 'button';
    excluir.textContent = 'Excluir';
    excluir.setAttribute('aria-label', `Excluir ${t.title}`);
    excluir.addEventListener('click', () => remover(t.id));

    li.append(check, label, excluir);
    lista.append(li);
  }
  const feitas = tarefas.filter((t) => t.done).length;
  vazio.hidden = tarefas.length > 0;
  lista.hidden = tarefas.length === 0;
  resumo.textContent = tarefas.length
    ? `${feitas} de ${tarefas.length} concluídas`
    : 'Lista vazia';
}

async function carregar() {
  try {
    renderizar(await api('GET', '/api/tasks'));
  } catch (e) {
    mostrarErro(e.message);
  }
}

async function alterar(id, done) {
  try { await api('PATCH', `/api/tasks/${id}`, { done }); } catch (e) { mostrarErro(e.message); }
  carregar();
}

async function remover(id) {
  try { await api('DELETE', `/api/tasks/${id}`); } catch (e) { mostrarErro(e.message); }
  carregar();
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try {
    await api('POST', '/api/tasks', { title: campo.value });
    campo.value = '';
    mostrarErro('');
    carregar();
  } catch (e) {
    mostrarErro(e.message);
  }
});

api('GET', '/api/version')
  .then((v) => { document.getElementById('versao').textContent = v.version; })
  .catch(() => {});

api('GET', '/health')
  .then(() => { document.getElementById('status').textContent = 'Servidor no ar'; })
  .catch(() => { document.getElementById('status').textContent = 'Servidor indisponível'; });

carregar();
