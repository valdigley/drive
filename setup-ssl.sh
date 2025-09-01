#!/bin/bash

# Script para configurar SSL com Let's Encrypt

echo "🔒 Configurando SSL para drive.fotografo.site..."

# Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Obter certificado SSL
echo "📜 Obtendo certificado SSL..."
sudo certbot --nginx -d drive.fotografo.site

# Configurar renovação automática
echo "🔄 Configurando renovação automática..."
sudo crontab -l | grep -q certbot || (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "✅ SSL configurado com sucesso!"
echo "🌐 Seu site está disponível em: https://drive.fotografo.site"