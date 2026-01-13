const fs = require('fs');
const path = require('path');

// Verificar se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ A biblioteca "sharp" não está instalada.');
  console.log('📦 Instalando sharp...');
  console.log('Execute: npm install sharp --save-dev');
  console.log('\nOu use o arquivo create-favicon.html no navegador para gerar os ícones manualmente.');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'client', 'public');

// Função para criar ícone com gradiente e texto "PE"
async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PE</text>
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, filename));
  
  console.log(`✅ Criado: ${filename} (${size}x${size})`);
}

// Função para criar favicon.ico
async function createFavicon() {
  const svg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" fill="url(#grad)" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PE</text>
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  
  console.log(`✅ Criado: favicon.ico (32x32)`);
}

async function generateAllIcons() {
  console.log('🎨 Gerando ícones PWA...\n');
  
  try {
    await createFavicon();
    await createIcon(192, 'icon-192x192.png');
    await createIcon(512, 'icon-512x512.png');
    
    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
    console.log('📦 Execute: cd client && npm run build');
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message);
    console.log('\n💡 Alternativa: Use o arquivo client/public/create-favicon.html no navegador.');
  }
}

generateAllIcons();
