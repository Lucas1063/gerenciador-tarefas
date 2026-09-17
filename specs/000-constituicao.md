# Constituição do Projeto

Princípios que não mudam e que toda especificação, plano e código devem respeitar.
Na técnica SDD (Spec-Driven Development) a especificação é a fonte da verdade:
o código é consequência dela, não o contrário.

## Princípios

1. **Especificação antes do código.** Nenhuma funcionalidade é implementada sem
   um requisito escrito em `specs/<feature>/spec.md` com critérios de aceitação.
2. **Rastreabilidade.** Todo teste automatizado cita o ID do requisito que valida
   (ex.: `RF-02`). Todo commit de implementação cita a tarefa (ex.: `T-05`).
3. **Teste primeiro.** Os critérios de aceitação viram testes antes da implementação.
4. **Segurança no pipeline.** Nenhum deploy acontece se o scanner de segurança
   (SonarQube Cloud) reprovar o Quality Gate ou se houver vulnerabilidade crítica
   na imagem Docker.
5. **Simplicidade.** Sem banco de dados externo nesta versão; armazenamento em memória.
6. **Infra reprodutível.** O ambiente sobe a partir de scripts versionados em `infra/`.

## Stack aprovada

- Node.js 24 + Express 5
- Jest + Supertest (testes e cobertura)
- Docker (imagem publicada no GitHub Container Registry)
- GitHub Actions (CI/CD)
- SonarQube Cloud + Trivy + npm audit (segurança)
- AWS EC2 Ubuntu 24.04 (execução)
