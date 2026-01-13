# 🔍 Diagnosticar Problemas do PWA

## ❌ Problemas Relatados:

1. PWA não instala automaticamente (só mostra alert)
2. Quando adiciona manualmente, abre no Chrome normal (não standalone)
3. Continua pedindo instalação mesmo após adicionar

## 🔍 Como Diagnosticar:

### 1. Abrir DevTools no Celular:

**Chrome Android:**
- Abra o site
- Menu (3 pontos) → "Mais ferramentas" → "Ferramentas do desenvolvedor"
- Ou conecte via USB e use Chrome DevTools no PC

**Safari iOS:**
- Configurações → Safari → Avançado → Web Inspector (ativar)
- Conecte via USB e use Safari DevTools no Mac

### 2. Verificar Service Worker:

No Console, execute:
```javascript
// Verificar se Service Worker está registrado
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
```

**Deve mostrar:**
- Pelo menos 1 Service Worker registrado
- Estado: "activated"
- Scope: deve ser a raiz do site

### 3. Verificar Manifest:

No Console, execute:
```javascript
// Verificar manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => {
    console.log('Manifest:', m);
    console.log('Display:', m.display);
    console.log('Start URL:', m.start_url);
  });
```

**Deve mostrar:**
- `display: "standalone"`
- `start_url: "/"` ou similar
- Ícones válidos

### 4. Verificar beforeinstallprompt:

No Console, execute:
```javascript
// Verificar se beforeinstallprompt está disponível
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt capturado!', e);
  deferredPrompt = e;
});
```

**Se não aparecer:**
- Service Worker pode não estar ativo
- Manifest.json pode ter problemas
- PWA já pode estar instalado

### 5. Verificar se está em modo standalone:

No Console, execute:
```javascript
// Verificar display mode
console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Navigator standalone:', window.navigator.standalone);
console.log('URL:', window.location.href);
console.log('Referrer:', document.referrer);
```

## 🔧 Possíveis Causas e Soluções:

### Causa 1: Service Worker não está ativo

**Sintomas:**
- `beforeinstallprompt` não aparece
- PWA não instala automaticamente

**Solução:**
1. Verificar se o Service Worker está sendo servido corretamente
2. Verificar logs do console para erros
3. Limpar cache e recarregar

### Causa 2: Manifest.json não está correto

**Sintomas:**
- PWA instala mas abre no navegador
- Não abre em modo standalone

**Solução:**
1. Verificar se `display: "standalone"` está no manifest
2. Verificar se `start_url` está correto
3. Verificar se os ícones estão acessíveis

### Causa 3: PWA já foi instalado anteriormente

**Sintomas:**
- `beforeinstallprompt` não aparece
- Continua pedindo instalação

**Solução:**
1. Desinstalar o PWA completamente
2. Limpar cache do navegador
3. Limpar Service Workers antigos
4. Acessar o site novamente

### Causa 4: Navegador não suporta PWA

**Sintomas:**
- `beforeinstallprompt` nunca aparece
- Não há opção de instalação no menu

**Solução:**
- Usar Chrome/Edge no Android
- Usar Safari no iOS
- Verificar versão do navegador

## 📋 Checklist de Verificação:

- [ ] Service Worker está registrado e ativo
- [ ] Manifest.json está acessível e válido
- [ ] `display: "standalone"` no manifest
- [ ] Site está em HTTPS
- [ ] Ícones estão acessíveis
- [ ] `beforeinstallprompt` está sendo capturado
- [ ] PWA não foi instalado anteriormente
- [ ] Navegador suporta PWA

## 🧪 Teste Completo:

1. **Limpar tudo:**
   ```javascript
   // No console do navegador
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister());
   });
   caches.keys().then(keys => {
     keys.forEach(key => caches.delete(key));
   });
   localStorage.clear();
   ```

2. **Recarregar a página**

3. **Verificar logs no console:**
   - Deve aparecer: "✅ Service Worker registrado com sucesso!"
   - Deve aparecer: "🎯 beforeinstallprompt capturado!"

4. **Tentar instalar:**
   - O banner deve aparecer
   - Ao clicar "Instalar Agora", deve abrir prompt nativo
   - Após instalar, deve abrir em modo standalone

## 🔄 Se ainda não funcionar:

1. Verificar se o Nginx está servindo os arquivos corretamente
2. Verificar se o Service Worker está no build
3. Verificar se o manifest.json está no build
4. Verificar logs do servidor para erros 404
