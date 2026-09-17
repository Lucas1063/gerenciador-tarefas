# Plano técnico: Gerenciador de Tarefas

Deriva de `spec.md`. Explica **como** os requisitos serão atendidos.

## Arquitetura

```
Navegador ──HTTP:80──> EC2 (Ubuntu 24.04)
                         └─ Docker: container "app" (porta 3000)
                              └─ Express 5
                                   ├─ /            -> public/ (HTML + JS)
                                   ├─ /health      -> RF-07
                                   ├─ /api/version -> RF-08
                                   └─ /api/tasks   -> RF-01..RF-06
```

## Módulos

| Arquivo | Responsabilidade | Requisitos |
|---------|------------------|------------|
| `src/taskStore.js` | Regras de negócio e armazenamento em memória | RF-01..RF-06 |
| `src/app.js` | Rotas HTTP, validação, segurança | RF-01..RF-08, RNF-01, RNF-02 |
| `src/server.js` | Inicialização na porta `PORT` | — |
| `public/` | Interface web | RF-09 |

## Pipeline CI/CD (GitHub Actions)

```
push/PR ─> 1. Testes + cobertura
          ─> 2. Segurança: SonarQube Cloud (Quality Gate) + npm audit
          ─> 3. Build da imagem + Trivy (vulnerabilidades críticas bloqueiam)
          ─> 4. Push para ghcr.io (somente main)
          ─> 5. Deploy na EC2 via SSH (somente main)
          ─> 6. Smoke test em http://<EC2>/health e publicação da versão
```

## Decisões

- **SonarQube Cloud** em vez de servidor próprio: gratuito para repositório público
  e não consome memória da EC2. (Alternativa: SonarQube em container numa t3.medium.)
- **GHCR** em vez de ECR: não exige credenciais AWS no pipeline.
- **Versão = SHA do commit**, injetada via variável `APP_VERSION`.
