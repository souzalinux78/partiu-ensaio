const fs = require('fs');
const path = require('path');

// Cores padrão (serão substituídas)
const CORES_PADRAO = {
  primaria: '#667eea',
  secundaria: '#764ba2'
};

// Obter cores da linha de comando ou usar padrão
const args = process.argv.slice(2);
let cores = { ...CORES_PADRAO };

if (args.length >= 2) {
  cores.primaria = args[0];
  cores.secundaria = args[1];
  console.log('🎨 Usando cores fornecidas:');
  console.log(`   Primária: ${cores.primaria}`);
  console.log(`   Secundária: ${cores.secundaria}`);
} else {
  console.log('⚠️  Usando cores padrão. Para usar cores personalizadas:');
  console.log('   node scripts/atualizar-cores-tema.js #COR1 #COR2');
  console.log('   Exemplo: node scripts/atualizar-cores-tema.js #FF6B6B #4ECDC4');
}

// Função para substituir cores em um arquivo
function atualizarCoresNoArquivo(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modificado = false;

    replacements.forEach(({ de, para }) => {
      // Substituir cores individuais
      const regexCor = new RegExp(de.replace('#', '\\#'), 'gi');
      if (content.match(regexCor)) {
        content = content.replace(regexCor, para);
        modificado = true;
      }

      // Substituir em gradientes (linear-gradient com a cor)
      const regexGradiente = new RegExp(
        `linear-gradient\\([^)]*${de.replace('#', '\\#')}[^)]*\\)`,
        'gi'
      );
      if (content.match(regexGradiente)) {
        // Substituir a cor no gradiente mantendo a estrutura
        content = content.replace(regexGradiente, (match) => {
          return match.replace(new RegExp(de.replace('#', '\\#'), 'gi'), para);
        });
        modificado = true;
      }
    });

    if (modificado) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
    return false;
  }
}

// Lista de arquivos para atualizar
const arquivos = [
  {
    path: path.join(__dirname, '../client/public/manifest.json'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria }
    ]
  },
  {
    path: path.join(__dirname, '../client/public/index.html'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria },
      { de: CORES_PADRAO.secundaria, para: cores.secundaria }
    ]
  },
  {
    path: path.join(__dirname, '../client/src/index.css'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria },
      { de: CORES_PADRAO.secundaria, para: cores.secundaria }
    ]
  },
  {
    path: path.join(__dirname, '../client/src/components/Login.css'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria },
      { de: CORES_PADRAO.secundaria, para: cores.secundaria }
    ]
  },
  {
    path: path.join(__dirname, '../client/src/components/Dashboard.css'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria },
      { de: CORES_PADRAO.secundaria, para: cores.secundaria }
    ]
  },
  {
    path: path.join(__dirname, '../client/src/components/InstallPrompt.css'),
    replacements: [
      { de: CORES_PADRAO.primaria, para: cores.primaria },
      { de: CORES_PADRAO.secundaria, para: cores.secundaria }
    ]
  }
];

// Também atualizar gradientes completos
const gradientes = [
  {
    path: path.join(__dirname, '../client/public/index.html'),
    de: `linear-gradient(135deg, ${CORES_PADRAO.primaria} 0%, ${CORES_PADRAO.secundaria} 100%)`,
    para: `linear-gradient(135deg, ${cores.primaria} 0%, ${cores.secundaria} 100%)`
  }
];

console.log('\n🔄 Atualizando cores do tema...\n');

let atualizados = 0;
arquivos.forEach(({ path: filePath, replacements }) => {
  if (fs.existsSync(filePath)) {
    if (atualizarCoresNoArquivo(filePath, replacements)) {
      atualizados++;
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
  }
});

// Atualizar gradientes completos
gradientes.forEach(({ path: filePath, de, para }) => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(de)) {
        content = content.replace(new RegExp(de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), para);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Gradiente atualizado: ${filePath}`);
        if (!arquivos.find(a => a.path === filePath)) {
          atualizados++;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao atualizar gradiente em ${filePath}:`, error.message);
    }
  }
});

console.log(`\n✅ ${atualizados} arquivo(s) atualizado(s) com sucesso!`);
console.log('\n📝 Próximos passos:');
console.log('   1. Revisar as alterações nos arquivos');
console.log('   2. Executar: cd client && npm run build');
console.log('   3. Testar o site com as novas cores');
