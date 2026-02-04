# 📦 Setup Next.js API Route

## ⚠️ Observação Importante

O projeto atual usa **React + Express**, mas foi criado um endpoint em **Next.js App Router** conforme solicitado.

## 📁 Estrutura Criada

```
src/
  app/
    api/
      ensaios/
        por-telefone/
          [telefone]/
            route.ts
```

## 🔧 Configuração Necessária

Se o projeto ainda não estiver configurado como Next.js, será necessário:

1. **Instalar Next.js:**
```bash
npm install next@latest react@latest react-dom@latest
```

2. **Criar `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

3. **Atualizar `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

4. **Criar `tsconfig.json` (se usar TypeScript):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🔄 Alternativa: Usar Express (Já Implementado)

O endpoint também foi criado em Express em:
- `server/routes/ensaio.js` (linha ~1042)
- `server/repositories/ensaiosRepository.js`
- `server/controllers/ensaiosController.js`

**Endpoint Express:**
```
GET /api/ensaio/por-telefone/:telefone
```

Este endpoint já está funcionando e pode ser usado imediatamente.

## 📝 Endpoint Next.js Criado

**Arquivo:** `src/app/api/ensaios/por-telefone/[telefone]/route.ts`

**Endpoint:** `GET /api/ensaios/por-telefone/:telefone`

**Funcionalidades:**
- ✅ Normalização de telefone (garante DDI 55)
- ✅ Busca por CURDATE() (dia atual)
- ✅ Filtro por status 'aprovado'
- ✅ ORDER BY horario ASC, LIMIT 1
- ✅ Retorna objeto vazio {} quando não encontra (status 200)
- ✅ Logs apenas em desenvolvimento
- ✅ Reutiliza configuração MySQL existente

## 🧪 Testes

Após configurar Next.js:

```bash
# Local
curl http://localhost:3000/api/ensaios/por-telefone/5511974605594

# Produção (se Next.js estiver configurado)
curl https://partiuensaio.automatizeonline.com.br/api/ensaios/por-telefone/5511974605594
```

## ⚡ Recomendação

Se o projeto ainda não usa Next.js, recomendo usar o endpoint Express já implementado:
- ✅ Já está funcionando
- ✅ Não requer configuração adicional
- ✅ Integrado com a estrutura existente

O endpoint Next.js está pronto para quando o projeto migrar para Next.js.
