# 🚀 Deploy do PhotoShare Pro na VPS

## 📋 Pré-requisitos

1. **VPS com Ubuntu/Debian**
2. **Domínio configurado**: `drive.fotografo.site` apontando para o IP da VPS
3. **Nginx instalado** na VPS
4. **Acesso SSH** à VPS

## 🔧 Passo a Passo

### 1. Conectar na VPS e clonar o projeto
```bash
ssh usuario@seu-servidor
cd /var/www
sudo git clone https://github.com/seu-usuario/photoshare-pro.git
cd photoshare-pro
```

### 2. Configurar variáveis de ambiente
```bash
# Copiar e editar arquivo de ambiente
sudo cp .env.production .env
sudo nano .env

# Configure suas credenciais do Supabase e R2
```

### 3. Executar deploy
```bash
# Dar permissão e executar script
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### 4. Configurar Nginx Reverse Proxy
```bash
# Copiar configuração do nginx
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/drive.fotografo.site

# Ativar site
sudo ln -s /etc/nginx/sites-available/drive.fotografo.site /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

### 5. Configurar SSL (HTTPS)
```bash
# Executar script de SSL
sudo chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

## 🌐 No seu site principal (fotografo.site)

Agora você pode usar diretamente a URL no botão:

```html
<a href="https://drive.fotografo.site/" class="btn-drive">
  📁 Drive
</a>
```

## ✅ Verificação

Após o deploy:
- ✅ Aplicação rodando em: `https://drive.fotografo.site`
- ✅ Autenticação automática via cookies do domínio principal
- ✅ SSL configurado
- ✅ Nginx reverse proxy funcionando

## 🔧 Comandos Úteis

```bash
# Ver logs da aplicação
sudo docker-compose logs -f

# Reiniciar aplicação
sudo docker-compose restart

# Parar aplicação
sudo docker-compose down

# Atualizar aplicação
git pull
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

## 🆘 Troubleshooting

Se der erro de autenticação, verifique:
1. Cookies do domínio principal estão sendo enviados
2. Configuração do nginx está correta
3. SSL está funcionando
4. Variáveis de ambiente estão configuradas