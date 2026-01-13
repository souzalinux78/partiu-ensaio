# 🔍 Verificar PWA no Servidor

## ⚠️ Problemas Identificados:
1. O PWA não instala automaticamente (só mostra alert)
2. Não aparece ícone após "instalar"
3. Quando clica no link, abre Chrome novamente
4. Não funciona como app standalone

## ✅ Correções Aplicadas:

### 1. **Lógica do InstallPrompt Melhorada**
- Agora aguarda o evento `beforeinstallprompt` corretamente
- Só mostra o banner quando o evento for capturado
- Remove alertas desnecessários

### 2. **Service Worker**
- Garantido que está sendo registrado em produção
- Logs adicionados para debug

### 3. **Manifest.json**
- Adicionado `display_override` para garantir standalone
- `start_url` com parâmetro para rastreamento

## 🔧 Verificações no Servidor:

### 1. Verificar se o Service Worker está sendo servido:
```bash
# No servidor, verificar se o arquivo existe:
ls -la /var/www/partiu-ensaio/client/build/service-worker.js

# Verificar se está acessível:
curl -I https://partiuensaio.automatizeonline.com.br/service-worker.js
```

**Deve retornar:**
```
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8
```

### 2. Verificar se o manifest.json está sendo servido:
```bash
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json
```

**Deve retornar:**
```
HTTP/1.1 200 OK
Content-Type: application/manifest+json
```

### 3. Verificar configuração do Nginx:
O Nginx deve servir os arquivos estáticos corretamente:

```nginx
# Verificar se está configurado para servir service-worker.js
location /service-worker.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Content-Type "application/javascript; charset=utf-8";
}

# Verificar se está configurado para servir manifest.json
location /manifest.json {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Content-Type "application/manifest+json";
}
```

## 🧪 Testar no Navegador:

### Chrome DevTools:
1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Verifique se há um Service Worker registrado e ativo
4. Vá em **Application** → **Manifest**
5. Verifique se o manifest está sendo carregado corretamente
6. Verifique se há erros no console

### Verificar Console:
```javascript
// No console do navegador, execute:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers registrados:', regs.length);
  regs.forEach(reg => {
    console.log('SW:', reg.scope, reg.active?.state);
  });
});

// Verificar se beforeinstallprompt está disponível:
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt capturado!', e);
});
```

## 🚨 Problemas Comuns:

### 1. Service Worker não está sendo servido:
**Solução:** Verificar permissões e configuração do Nginx

### 2. Manifest.json com content-type errado:
**Solução:** Adicionar header correto no Nginx:
```nginx
location ~* \.(json)$ {
    add_header Content-Type "application/json; charset=utf-8";
}
```

### 3. PWA não instala:
**Causas possíveis:**
- Service Worker não está ativo
- Manifest.json não está acessível
- Site não está em HTTPS (obrigatório para PWA)
- Ícones não estão acessíveis

## 📋 Checklist:

- [ ] Service Worker está registrado e ativo
- [ ] Manifest.json está acessível e válido
- [ ] Site está em HTTPS
- [ ] Ícones estão acessíveis
- [ ] `beforeinstallprompt` está sendo capturado
- [ ] Nginx está servindo arquivos com content-type correto

## 🔄 Após Correções:

1. **Limpar cache do navegador**
2. **Desinstalar PWA se já estiver instalado**
3. **Acessar o site novamente**
4. **Aguardar o banner aparecer**
5. **Clicar em "Instalar Agora"**
6. **Verificar se instala corretamente**
