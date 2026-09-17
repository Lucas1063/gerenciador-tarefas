#!/bin/bash
# Executado automaticamente na primeira inicializacao da EC2 (Ubuntu 24.04)
set -e
apt-get update -y
apt-get install -y docker.io curl
systemctl enable --now docker
usermod -aG docker ubuntu
