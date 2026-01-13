# 🎨 Criar Ícones PWA

## ❌ Problema Atual:

O console mostra erros:
- `icon-192x192.png` não encontrado (404)
- `favicon.ico` não encontrado (404)

## ✅ Solução:

### Opção 1: Gerar Ícones Automaticamente (Recomendado)

1. **Abra o arquivo no navegador:**
   ```
   client/public/create-favicon.html
   ```

2. **Clique nos botões para baixar:**
   - "Baixar favicon.ico"
   - "Baixar icon-192x192.png"
   - "Baixar icon-512x512.png"

3. **Mova os arquivos para:**
   ```
   client/public/
   ```

4. **Faça rebuild:**
   ```bash
   cd client
   npm run build
   ```

### Opção 2: Usar Ícones Temporários (Rápido)

Se quiser testar rapidamente sem criar ícones, o `manifest.json` já está configurado para funcionar sem ícones. O PWA funcionará, mas sem ícones personalizados.

## 🔍 Verificar:

Após criar os ícones e fazer rebuild, verifique no console:
- ✅ Não deve mais aparecer erro 404 para os ícones
- ✅ O PWA deve estar pronto para instalação

## 📝 Nota:

Os ícones gerados terão:
- Fundo gradiente roxo/azul (#667eea → #764ba2)
- Texto "PE" branco centralizado
- Tamanhos: 192x192 e 512x512 para PWA
