# Especificação: Gerenciador de Tarefas

- **Feature:** 001-gerenciador-tarefas
- **Status:** Aprovada
- **Autores:** <aluno 1>, <aluno 2>

## 1. Problema

Estudantes precisam de uma lista simples de tarefas acessível pela internet,
sem cadastro, para organizar entregas do semestre.

## 2. Histórias de usuário

- **HU-01** Como estudante, quero cadastrar uma tarefa com título para não esquecê-la.
- **HU-02** Como estudante, quero ver todas as minhas tarefas.
- **HU-03** Como estudante, quero marcar uma tarefa como concluída.
- **HU-04** Como estudante, quero excluir uma tarefa.
- **HU-05** Como equipe de operação, quero saber se a aplicação está no ar e qual versão está publicada.

## 3. Requisitos funcionais

| ID | Requisito | História |
|----|-----------|----------|
| RF-01 | `GET /api/tasks` lista todas as tarefas em ordem de criação. | HU-02 |
| RF-02 | `POST /api/tasks` cria tarefa com `title` (texto de 3 a 100 caracteres, sem espaços nas pontas). Retorna 201 e a tarefa criada com `id`, `title`, `done=false`, `createdAt`. | HU-01 |
| RF-03 | Título inválido ou ausente retorna 400 com mensagem de erro. | HU-01 |
| RF-04 | `PATCH /api/tasks/:id` altera `done` (booleano). Retorna 200 e a tarefa atualizada. | HU-03 |
| RF-05 | `DELETE /api/tasks/:id` remove a tarefa. Retorna 204. | HU-04 |
| RF-06 | Operações sobre `id` inexistente retornam 404. | HU-03, HU-04 |
| RF-07 | `GET /health` retorna 200 `{ "status": "ok" }`. | HU-05 |
| RF-08 | `GET /api/version` retorna a versão publicada (commit do deploy). | HU-05 |
| RF-09 | A página inicial (`/`) permite usar todas as funções acima pelo navegador. | HU-01..05 |

## 4. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Cabeçalhos de segurança HTTP ativos (Helmet); cabeçalho `X-Powered-By` removido. |
| RNF-02 | Corpo JSON limitado a 10 kB. JSON malformado retorna 400. |
| RNF-03 | Cobertura de testes mínima de 80%. |
| RNF-04 | Container roda como usuário não-root. |
| RNF-05 | Deploy só ocorre após aprovação no Quality Gate do SonarQube Cloud. |

## 5. Critérios de aceitação (Given / When / Then)

- **CA-01 (RF-02)** Dado nenhum dado, quando envio `{ "title": "Estudar SDD" }`, então recebo 201 e `done=false`.
- **CA-02 (RF-03)** Quando envio `{ "title": "ab" }`, então recebo 400.
- **CA-03 (RF-03)** Quando envio `{}`, então recebo 400.
- **CA-04 (RF-04)** Dada uma tarefa criada, quando envio `{ "done": true }`, então ela retorna com `done=true`.
- **CA-05 (RF-04)** Quando envio `{ "done": "sim" }`, então recebo 400.
- **CA-06 (RF-05)** Dada uma tarefa criada, quando a excluo, então recebo 204 e ela não aparece mais na listagem.
- **CA-07 (RF-06)** Quando altero ou excluo o id `999`, então recebo 404.
- **CA-08 (RF-07)** Quando acesso `/health`, então recebo `status: ok`.
- **CA-09 (RNF-02)** Quando envio JSON malformado, então recebo 400.

## 6. Fora do escopo

Autenticação, persistência em banco de dados, múltiplos usuários.
