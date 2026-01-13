# 🔧 Correção do Erro de Build

## ❌ Erro Encontrado:
```
[eslint] 
src/utils/notifications.js
  Line 168:5:   Unexpected use of 'self'  no-restricted-globals
  Line 174:11:  'clients' is not defined  no-undef
```

## ✅ Solução Aplicada:
O arquivo `client/src/utils/notifications.js` foi corrigido removendo o uso de `self` e `clients` que são variáveis do Service Worker e não devem ser usadas no contexto do navegador.

## 📋 Próximos Passos:

### 1. Fazer Commit e Push das Correções:
```bash
# No seu computador local (Windows)
git add client/src/utils/notifications.js
git commit -m "Corrigir erro de build: remover uso de self e clients do notifications.js"
git push origin master
```

### 2. Atualizar no Servidor:
```bash
# No servidor Linux
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
cd ..
pm2 restart partiu-ensaio --update-env
```

## ✅ Verificação:
Após o push e pull, o build deve funcionar corretamente. O arquivo `notifications.js` agora está compatível com o contexto do navegador.
