# Configuração PWA - Partiu Ensaio

## ✅ Arquivos Criados

1. **manifest.json** - Configuração do PWA
2. **service-worker.js** - Service Worker para cache offline
3. **serviceWorkerRegistration.js** - Registro do service worker
4. **icon-generator.html** - Gerador de ícones básicos

## 📱 Próximos Passos

### 1. Criar Ícones

Você precisa criar dois ícones e colocá-los na pasta `client/public/`:

- **icon-192x192.png** (192x192 pixels)
- **icon-512x512.png** (512x512 pixels)

#### Opções para criar ícones:

**Opção 1: Usar o gerador incluído**
1. Abra `client/public/icon-generator.html` no navegador
2. Clique em "Download 192x192" e "Download 512x512"
3. Salve os arquivos na pasta `client/public/`

**Opção 2: Usar ferramentas online**
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Favicon.io](https://favicon.io/)

**Opção 3: Criar manualmente**
- Use um editor de imagens (Photoshop, GIMP, Canva)
- Crie imagens quadradas com o logo "Partiu Ensaio"
- Exporte nos tamanhos 192x192 e 512x512 pixels
- Salve como PNG na pasta `client/public/`

### 2. Testar o PWA

#### Em desenvolvimento:
```bash
cd client
npm start
```

#### Em produção:
```bash
cd client
npm run build
```

Depois, sirva a pasta `build` com um servidor HTTPS (PWA requer HTTPS em produção).

### 3. Instalar no Celular

#### Android (Chrome):
1. Acesse o site no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial" ou "Instalar app"

#### iOS (Safari):
1. Acesse o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"

### 4. Verificar Funcionalidades

- ✅ App pode ser instalado
- ✅ Funciona offline (com cache)
- ✅ Ícone aparece na tela inicial
- ✅ Abre em modo standalone (sem barra do navegador)

## 🔧 Configurações Atuais

- **Nome curto**: Partiu Ensaio
- **Nome completo**: Partiu Ensaio - Agenda Musical
- **Cor do tema**: #667eea (roxo)
- **Orientação**: Portrait (vertical)
- **Display**: Standalone (sem navegador)

## 📝 Notas Importantes

1. **HTTPS obrigatório**: PWAs só funcionam completamente com HTTPS (exceto localhost)
2. **Service Worker**: Já configurado para cache offline
3. **Atualizações**: O app avisará quando houver nova versão
4. **Ícones**: Use imagens de alta qualidade para melhor experiência

## 🐛 Troubleshooting

Se o PWA não aparecer para instalação:
- Verifique se está usando HTTPS (ou localhost)
- Verifique se os ícones existem na pasta public
- Verifique o console do navegador para erros
- Limpe o cache do navegador
