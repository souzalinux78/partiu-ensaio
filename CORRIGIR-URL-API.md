# Correção de URL da API - Frontend

## 🔧 Problema Identificado

O frontend estava tentando acessar `http://localhost:5000/api` mesmo quando acessado via domínio público (`partiuensaio.automatizeonline.com.br`), causando erro de conexão.

## ✅ Correções Aplicadas

### 1. **`client/src/utils/api.js`**
- ✅ Criada função `getApiUrl()` que detecta automaticamente se está em localhost ou produção
- ✅ Em produção, usa URL relativa `/api` (mesmo domínio)
- ✅ Em localhost, usa `http://localhost:5000/api`
- ✅ Criada função `getBaseUrl()` para URLs de imagens/arquivos estáticos

### 2. **Componentes Corrigidos:**
- ✅ `DashboardAdmin.js` - URLs de imagens
- ✅ `EnsaiosPublicos.js` - URLs de imagens
- ✅ `DashboardMusico.js` - URLs de imagens
- ✅ `DashboardEncarregado.js` - URLs de imagens

## 🚀 Como Funciona Agora

### Em Localhost (Desenvolvimento):
- API: `http://localhost:5000/api`
- Imagens: `http://localhost:5000/uploads/...`

### Em Produção:
- API: `/api` (mesmo domínio)
- Imagens: `/uploads/...` (mesmo domínio)

## 📋 Próximos Passos no Servidor

### 1. Rebuild do Frontend

```bash
cd /var/www/partiu-ensaio/client
npm run build
```

### 2. Verificar Nginx

Certifique-se de que o Nginx está configurado para servir a API:

```nginx
# Exemplo de configuração Nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /uploads {
    alias /var/www/partiu-ensaio/server/uploads;
}
```

### 3. Reiniciar Serviços

```bash
# Reiniciar PM2
pm2 restart partiu-ensaio

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔍 Verificar se Funcionou

1. Acesse: `https://partiuensaio.automatizeonline.com.br/login`
2. Tente fazer login
3. Abra o DevTools (F12) → Console
4. Não deve aparecer mais erros de `localhost:5000`

## ⚙️ Configuração Opcional (Variável de Ambiente)

Se quiser forçar uma URL específica, crie `client/.env.production`:

```env
REACT_APP_API_URL=https://partiuensaio.automatizeonline.com.br/api
```

Depois faça rebuild:
```bash
npm run build
```

## ✅ Checklist

- [ ] Código corrigido (já feito)
- [ ] Rebuild do frontend executado
- [ ] Nginx configurado para `/api` e `/uploads`
- [ ] PM2 reiniciado
- [ ] Nginx reiniciado
- [ ] Teste de login funcionando
- [ ] Imagens carregando corretamente
