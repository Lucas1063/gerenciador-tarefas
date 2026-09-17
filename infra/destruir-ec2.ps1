# Remove tudo o que criar-ec2.ps1 criou (evita cobrancas depois da apresentacao).
# Uso: .\infra\destruir-ec2.ps1

$ErrorActionPreference = "Continue"
$env:AWS_DEFAULT_REGION = "us-east-1"
$Projeto = "gerenciador-tarefas"

$Id = aws ec2 describe-instances --filters "Name=tag:Name,Values=$Projeto" "Name=instance-state-name,Values=running,stopped" `
  --query "Reservations[0].Instances[0].InstanceId" --output text

if ($Id -and $Id -ne "None") {
  $Alloc = aws ec2 describe-addresses --filters "Name=instance-id,Values=$Id" --query "Addresses[0].AllocationId" --output text
  if ($Alloc -and $Alloc -ne "None") {
    $Assoc = aws ec2 describe-addresses --allocation-ids $Alloc --query "Addresses[0].AssociationId" --output text
    aws ec2 disassociate-address --association-id $Assoc
    aws ec2 release-address --allocation-id $Alloc
  }
  aws ec2 terminate-instances --instance-ids $Id | Out-Null
  aws ec2 wait instance-terminated --instance-ids $Id
}

$Sg = aws ec2 describe-security-groups --group-names "$Projeto-sg" --query "SecurityGroups[0].GroupId" --output text
if ($Sg -and $Sg -ne "None") { aws ec2 delete-security-group --group-id $Sg }
aws ec2 delete-key-pair --key-name "$Projeto-key"
Write-Host "Recursos removidos."
