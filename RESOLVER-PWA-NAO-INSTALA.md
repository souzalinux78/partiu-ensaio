# 🔧 Resolver: PWA Não Instala Automaticamente

## ❌ Problemas:

1. PWA não instala automaticamente (só mostra alert)
2. Quando adiciona manualmente, abre no Chrome normal (não standalone)
3. Continua pedindo instalação mesmo após adicionar

## 🔍 Causa Raiz:

O `beforeinstallprompt` **NÃO está sendo disparado** porque:
- Service Worker pode não estar ativo
- Manifest.json pode não estar sendo reconhecido
- PWA pode já estar instalado (mas não detectado)

## ✅ Correções Aplicadas:

### 1. **Service Worker registrado imediatamente**
- Não espera mais pelo evento 'load'
- Registra assim que o código carrega

### 2. **Detecção de instalação melhorada**
- Verifica periodicamente se o PWA foi instalado
- Detecta modo standalone corretamente
- Recarrega após instalação para garantir modo standalone

### 3. **Logs de debug adicionados**
- Verifica Service Worker
- Verifica manifest.json
- Mostra avisos se beforeinstallprompt não aparecer

## 🧪 Como Testar no Celular:

### 1. Limpar TUDO primeiro:

No console do navegador (conecte via USB ou use Chrome DevTools remoto):
```javascript
// Limpar Service Workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  console.log('✅ Service Workers removidos');
});

// Limpar caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('✅ Caches limpos');
});

// Limpar localStorage
localStorage.clear();
console.log('✅ LocalStorage limpo');
```

### 2. Desinstalar PWA se já estiver instalado:
- Android: Configurações → Apps → Partiu Ensaio → Desinstalar
- iOS: Remover da tela inicial (segurar ícone → remover)

### 3. Recarregar a página completamente:
- Fechar todas as abas do site
- Abrir uma nova aba
- Acessar o site novamente

### 4. Verificar no Console:

Deve aparecer:
```
🔧 Registrando Service Worker para PWA...
✅ Service Worker registrado com sucesso!
✅ PWA pronto para instalação!
🎯 beforeinstallprompt capturado!
```

### 5. Se `beforeinstallprompt` NÃO aparecer:

Verificar:
```javascript
// Verificar Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach(reg => {
    console.log('SW:', {
      scope: reg.scope,
      state: reg.active?.state,
      scriptURL: reg.active?.scriptURL
    });
  });
});

// Verificar manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => {
    console.log('Manifest:', m);
    console.log('Display:', m.display);
  });
```

## 🔧 Se ainda não funcionar:

### Verificar no Servidor:

1. **Service Worker está acessível:**
```bash
curl -I https://partiuensaio.automatizeonline.com.br/service-worker.js
# Deve retornar 200 OK
```

2. **Manifest.json está acessível:**
```bash
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json
# Deve retornar: Content-Type: application/manifest+json
```

3. **Verificar se está no build:**
```bash
ls -la /var/www/partiu-ensaio/client/build/service-worker.js
ls -la /var/www/partiu-ensaio/client/build/manifest.json
```

### Verificar no Navegador (DevTools):

1. **Application → Service Workers:**
   - Deve mostrar 1 Service Worker
   - Status: "activated and is running"
   - Scope: deve ser a raiz do site

2. **Application → Manifest:**
   - Deve carregar sem erros
   - `display: "standalone"`
   - Ícones válidos

3. **Console:**
   - Não deve ter erros
   - Deve aparecer logs de Service Worker

## ⚠️ Requisitos para beforeinstallprompt:

1. ✅ Service Worker registrado e ativo
2. ✅ Manifest.json válido e acessível
3. ✅ Site em HTTPS
4. ✅ Ícones válidos (pelo menos 192x192)
5. ✅ `display: "standalone"` no manifest
6. ❌ PWA NÃO deve estar já instalado

## 🔄 Após Fazer Commit e Push:

1. No servidor, fazer build:
```bash
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
cd ..
pm2 restart partiu-ensaio --update-env
```

2. No celular:
   - Limpar tudo (Service Workers, caches, localStorage)
   - Desinstalar PWA se existir
   - Acessar o site novamente
   - Verificar console para logs
   - Aguardar banner aparecer
   - Tentar instalar

## 📝 Nota Importante:

Se o `beforeinstallprompt` não aparecer após todas essas verificações, pode ser que:
- O navegador não suporte (use Chrome/Edge no Android)
- O PWA já foi instalado anteriormente (mesmo que não apareça)
- Há algum problema com o manifest.json ou Service Worker

Nesse caso, a instalação manual pelos 3 pontinhos é a única opção, mas após instalar, deve abrir em modo standalone.
