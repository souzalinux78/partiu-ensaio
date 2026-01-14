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
const logoPath = path.join(publicDir, 'logo.png');

// Verificar se o logo existe
const logoExists = fs.existsSync(logoPath);

// Função para criar ícone a partir do logo
async function createIconFromLogo(size, filename) {
  if (!logoExists) {
    console.warn(`⚠️  Logo não encontrado em ${logoPath}`);
    console.warn(`   Criando ícone simples com "PE" como fallback`);
    return createSimpleIcon(size, filename);
  }

  try {
    // Carregar o logo
    const logo = sharp(logoPath);
    const metadata = await logo.metadata();
    
    // Redimensionar mantendo proporção e centralizando
    await logo
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo transparente
      })
      .png()
      .toFile(path.join(publicDir, filename));
    
    console.log(`✅ Criado: ${filename} (${size}x${size}) a partir do logo`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${filename} a partir do logo:`, error.message);
    console.log(`   Usando fallback simples...`);
    return createSimpleIcon(size, filename);
  }
}

// Função para criar ícone simples (fallback)
async function createSimpleIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2d2d2d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D4AF37;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PE</text>
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, filename));
  
  console.log(`✅ Criado: ${filename} (${size}x${size}) - Fallback simples`);
}

// Função para criar favicon.ico
async function createFavicon() {
  if (logoExists) {
    try {
      await sharp(logoPath)
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(path.join(publicDir, 'favicon.ico'));
      console.log(`✅ Criado: favicon.ico (32x32) a partir do logo`);
      return;
    } catch (error) {
      console.warn(`⚠️  Erro ao criar favicon do logo:`, error.message);
      console.log(`   Usando fallback...`);
    }
  }

  // Fallback simples
  const svg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2d2d2d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D4AF37;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" fill="url(#grad)" rx="6" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PE</text>
    </svg>
  `;

  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  
  console.log(`✅ Criado: favicon.ico (32x32) - Fallback simples`);
}

async function generateAllIcons() {
  console.log('🎨 Gerando ícones PWA...\n');
  
  if (logoExists) {
    console.log(`✅ Logo encontrado: ${logoPath}`);
    console.log('   Usando logo como base para os ícones\n');
  } else {
    console.warn(`⚠️  Logo não encontrado em: ${logoPath}`);
    console.log('   Usando ícones simples como fallback\n');
    console.log('💡 Dica: Coloque o arquivo logo.png em client/public/ para usar o logo real\n');
  }
  
  try {
    await createFavicon();
    await createIconFromLogo(192, 'icon-192x192.png');
    await createIconFromLogo(512, 'icon-512x512.png');
    
    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
    console.log('📦 Próximos passos:');
    console.log('   1. Execute: cd client && npm run build');
    console.log('   2. No servidor: git pull && cd client && npm run build');
    console.log('   3. Limpe o cache do navegador e reinstale o PWA');
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message);
    console.log('\n💡 Alternativa: Use o arquivo client/public/gerar-icones-e-cores.html no navegador.');
  }
}

generateAllIcons();
