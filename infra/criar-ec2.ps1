# Cria a infraestrutura na AWS: chave SSH, Security Group, EC2 com Docker e IP fixo.
# Uso (na raiz do repositorio, no terminal do VS Code):  .\infra\criar-ec2.ps1
# Pre-requisito: AWS CLI instalado e "aws configure" feito (ou credenciais do AWS Academy).

$ErrorActionPreference = "Stop"
function Checar($etapa) { if ($LASTEXITCODE -ne 0) { throw "Falha em: $etapa" } }

$Regiao    = "us-east-1"
$Projeto   = "gerenciador-tarefas"
$NomeChave = "$Projeto-key"
$NomeSG    = "$Projeto-sg"
$Tipo      = "t3.micro"
$PastaSsh  = Join-Path $HOME ".ssh"
$Pem       = Join-Path $PastaSsh "$NomeChave.pem"

$env:AWS_DEFAULT_REGION = $Regiao
New-Item -ItemType Directory -Force -Path $PastaSsh | Out-Null

Write-Host "1/6 Criando par de chaves SSH..."
$material = aws ec2 create-key-pair --key-name $NomeChave --key-type rsa --key-format pem `
  --query KeyMaterial --output text
Checar "criar chave (se ja existe, rode destruir-ec2.ps1)"
[IO.File]::WriteAllText($Pem, (($material -join "`n") + "`n"))
icacls $Pem /inheritance:r | Out-Null
icacls $Pem /grant:r "$($env:USERNAME):(R)" | Out-Null
Write-Host "    Chave salva em $Pem"

Write-Host "2/6 Criando Security Group (portas 22 e 80)..."
$Vpc = aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text
$Sg = aws ec2 create-security-group --group-name $NomeSG --description "HTTP e SSH para $Projeto" `
  --vpc-id $Vpc --query GroupId --output text
Checar "criar security group"
aws ec2 authorize-security-group-ingress --group-id $Sg --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
# Porta 22 aberta para a internet porque os runners do GitHub Actions usam IPs variaveis.
# O acesso continua protegido: somente login por chave privada.
aws ec2 authorize-security-group-ingress --group-id $Sg --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null

Write-Host "3/6 Buscando AMI Ubuntu 24.04..."
$Ami = aws ssm get-parameters `
  --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id `
  --query "Parameters[0].Value" --output text
Checar "buscar AMI"

Write-Host "4/6 Criando instancia EC2 ($Tipo)..."
$Id = aws ec2 run-instances --image-id $Ami --instance-type $Tipo --key-name $NomeChave `
  --security-group-ids $Sg --user-data file://infra/user-data.sh `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$Projeto}]" `
  --query "Instances[0].InstanceId" --output text
Checar "criar instancia"
aws ec2 wait instance-running --instance-ids $Id

Write-Host "5/6 Alocando IP elastico (IP fixo)..."
$Alloc = aws ec2 allocate-address --domain vpc --query AllocationId --output text
Checar "alocar IP elastico"
aws ec2 associate-address --instance-id $Id --allocation-id $Alloc | Out-Null
$Ip = aws ec2 describe-addresses --allocation-ids $Alloc --query "Addresses[0].PublicIp" --output text

Write-Host "6/6 Pronto!"
Write-Host ""
Write-Host "  Instancia : $Id"
Write-Host "  IP publico: $Ip"
Write-Host "  Chave     : $Pem"
Write-Host ""
Write-Host "Aguarde ~2 minutos para o Docker terminar de instalar e teste:"
Write-Host "  ssh -i `"$Pem`" ubuntu@$Ip `"docker --version`""
