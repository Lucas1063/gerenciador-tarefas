# Gerenciador de Tarefas

Sistema simples de tarefas desenvolvido com **SDD (Spec-Driven Development)**,
com pipeline CI/CD no **GitHub Actions**, análise de segurança no **SonarQube Cloud**
e **Trivy**, e deploy automático em uma **AWS EC2**.

- **Aplicação publicada:** http://SEU_IP_AQUI
- **Integrantes:** Aluno 1, Aluno 2

## Como o SDD foi aplicado

A especificação é a fonte da verdade. O fluxo seguido foi:

| Etapa | Artefato | O que contém |
|-------|----------|--------------|
| 1. Constituição | [`specs/000-constituicao.md`](specs/000-constituicao.md) | Princípios e stack aprovada |
| 2. Especificar | [`specs/001-gerenciador-tarefas/spec.md`](specs/001-gerenciador-tarefas/spec.md) | Histórias, requisitos (RF/RNF) e critérios de aceitação |
| 3. Planejar | [`specs/001-gerenciador-tarefas/plan.md`](specs/001-gerenciador-tarefas/plan.md) | Arquitetura, módulos e pipeline |
| 4. Tarefas | [`specs/001-gerenciador-tarefas/tasks.md`](specs/001-gerenciador-tarefas/tasks.md) | Tarefas rastreáveis aos requisitos |
| 5. Implementar | `tests/` → `src/` | Testes citam os IDs dos critérios (CA-01…CA-09) |

## Pipeline

```
push na main
  ├─ 1. npm test (cobertura ≥ 80%) → npm audit → SonarQube Cloud (Quality Gate)
  ├─ 2. docker build → Trivy (bloqueia CVE crítica) → push ghcr.io
  └─ 3. SSH na EC2 → docker run → smoke test → GitHub Release com a versão
```

Pull requests executam as etapas 1 e 2, sem publicar nem fazer deploy.

## Rodar localmente

```powershell
npm install
npm test
npm run dev   # http://localhost:3000
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da aplicação |
| GET | `/api/version` | Versão publicada |
| GET | `/api/tasks` | Lista tarefas |
| POST | `/api/tasks` | Cria tarefa `{ "title": "..." }` |
| PATCH | `/api/tasks/:id` | Altera `{ "done": true }` |
| DELETE | `/api/tasks/:id` | Remove tarefa |

## Infraestrutura

Scripts em [`infra/`](infra/). Passo a passo completo em [`docs/GUIA-WINDOWS.md`](docs/GUIA-WINDOWS.md).
