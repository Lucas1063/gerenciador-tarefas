# Guia passo a passo (Windows + terminal do VS Code)

Todos os comandos são para o **PowerShell** (terminal padrão do VS Code no Windows).

## 0. Instalar ferramentas (uma vez, cada integrante)

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id GitHub.cli -e
winget install --id Amazon.AWSCLI -e
```

Feche e reabra o VS Code. Confira:

```powershell
git --version; node -v; gh --version; aws --version
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
git config --global core.autocrlf input
gh auth login        # GitHub.com > HTTPS > Login with a web browser
```

## 1. Repositório no GitHub (aluno 1)

Extraia o zip, abra a pasta no VS Code (`File > Open Folder`) e no terminal:

```powershell
git init -b main
git add .
git commit -m "T-01: estrutura inicial e especificacoes SDD"
gh repo create gerenciador-tarefas --public --source . --push
gh repo edit --enable-issues
gh api -X PUT "repos/{owner}/gerenciador-tarefas/collaborators/USUARIO_DO_COLEGA"
```

O repositório precisa ser **público** para o SonarQube Cloud gratuito.

Aluno 2 aceita o convite (e-mail) e clona:

```powershell
gh repo clone USUARIO_ALUNO1/gerenciador-tarefas
cd gerenciador-tarefas
npm install
npm test
```

Fluxo em dupla: cada tarefa do `tasks.md` em uma branch + Pull Request.

```powershell
git switch -c feat/T-05-interface
# ... alterações ...
git add .; git commit -m "T-05: interface web (RF-09)"
git push -u origin feat/T-05-interface
gh pr create --fill
```

## 2. SonarQube Cloud (scanner de segurança)

1. Acesse https://sonarcloud.io e entre com a conta do GitHub.
2. **Import an organization** → escolha sua conta → plano Free.
3. **Analyze new project** → selecione `gerenciador-tarefas`.
4. Em **Administration > Analysis Method**, **desligue "Automatic Analysis"**
   (senão o scan pelo GitHub Actions falha).
5. Em **My Account > Security**, gere um token.
6. Anote a *Organization Key* e a *Project Key* e edite `sonar-project.properties`.

```powershell
gh secret set SONAR_TOKEN     # cole o token quando pedir
```

## 3. AWS: criar a EC2

### Credenciais

- Conta AWS própria: `aws configure` (Access Key, Secret, região `us-east-1`).
- AWS Academy Learner Lab: *Start Lab* → *AWS Details* → *Show* em AWS CLI →
  cole o conteúdo em `%USERPROFILE%\.aws\credentials`. As credenciais expiram
  quando o lab encerra; a EC2 continua existindo.

```powershell
aws sts get-caller-identity
```

### Criar a infraestrutura

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\infra\criar-ec2.ps1
```

Anote o IP exibido. Após ~2 minutos:

```powershell
ssh -i "$HOME\.ssh\gerenciador-tarefas-key.pem" ubuntu@SEU_IP "docker --version"
```

(Alternativa pelo console: EC2 > Launch instance > Ubuntu 24.04, t3.micro,
Security Group com portas 22 e 80, colar `infra/user-data.sh` em *Advanced details > User data*.)

## 4. Secrets e variáveis do pipeline

```powershell
gh variable set EC2_HOST --body "SEU_IP"
gh variable set EC2_USER --body "ubuntu"
Get-Content "$HOME\.ssh\gerenciador-tarefas-key.pem" -Raw | gh secret set EC2_SSH_KEY
gh secret list; gh variable list
```

> No PowerShell não use `gh secret set X < arquivo` (o `<` não funciona). Use o pipe `|`.

## 5. Rodar o pipeline

```powershell
git add .
git commit -m "T-09: configura sonar e pipeline"
git push
gh run watch
```

Ao terminar, abra `http://SEU_IP`. A versão aparece no rodapé da página e na aba **Releases**.

## 6. Evidências para a entrega

- Print do Actions com os 3 jobs verdes.
- Print do SonarQube Cloud com *Quality Gate: Passed*.
- Print da Release e da aplicação aberta no navegador.
- Demonstração de bloqueio: crie uma branch com uma falha proposital
  (ex.: `eval(req.body.title)` em `app.js`), abra um PR e mostre o pipeline reprovando.

## 7. Problemas comuns

| Sintoma | Causa / solução |
|---------|-----------------|
| Sonar: *"You are running CI analysis while Automatic Analysis is enabled"* | Desligue Automatic Analysis (passo 2.4). |
| Sonar: *Project not found* | `sonar.organization` / `sonar.projectKey` diferentes do site. |
| `ssh: handshake failed` no deploy | Secret `EC2_SSH_KEY` incompleto (precisa das linhas BEGIN/END) ou usuário diferente de `ubuntu`. |
| `dial tcp ... i/o timeout` no deploy | Porta 22 fechada no Security Group ou IP mudou (use o IP elástico). |
| `docker: command not found` na EC2 | O user-data ainda está rodando; aguarde ou execute `sudo apt install -y docker.io`. |
| `UNPROTECTED PRIVATE KEY FILE` no ssh | Rode `icacls` como no script `criar-ec2.ps1`. |
| Trivy reprovou | Atualize a imagem base no `Dockerfile` e as dependências (`npm update`). |
| `Scripts is disabled on this system` | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`. |

## 8. Depois da apresentação

```powershell
.\infra\destruir-ec2.ps1
```
