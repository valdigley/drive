#!/bin/bash

# PhotoShare Pro - Deploy Script
echo "🚀 Iniciando deploy do PhotoShare Pro..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Faça logout e login novamente."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
sudo docker-compose down

# Construir e iniciar
echo "🔨 Construindo aplicação..."
sudo docker-compose build --no-cache

echo "🚀 Iniciando aplicação..."
sudo docker-compose up -d

# Verificar status
echo "📊 Verificando status..."
sudo docker-compose ps

echo ""
echo "✅ Deploy concluído!"
echo "📱 Aplicação rodando em: http://localhost:3001"
echo "🌐 Configure seu nginx para apontar drive.fotografo.site para localhost:3001"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Configure o nginx reverse proxy"
echo "3. Configure SSL com Let's Encrypt"
echo ""
echo "🔧 Para ver logs: sudo docker-compose logs -f"
echo "🛑 Para parar: sudo docker-compose down"