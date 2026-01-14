const fs = require('fs');
const path = require('path');

// Cores padrão (serão substituídas)
const CORES_PADRAO = {
  primaria: '#667eea',
  secundaria: '#764ba2'
};

// Função para normalizar cor (garantir que tenha #)
function normalizarCor(cor) {
  if (!cor) return null;
  cor = cor.trim();
  // Se não começar com #, adicionar
  if (!cor.startsWith('#')) {
    cor = '#' + cor;
  }
  // Validar formato hexadecimal (6 caracteres após #)
  if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
    return null;
  }
  return cor.toUpperCase();
}

// Obter cores da linha de comando, variáveis de ambiente ou usar padrão
const args = process.argv.slice(2);
let cores = { ...CORES_PADRAO };

// Tentar obter das variáveis de ambiente primeiro (para evitar problemas com # no shell)
const corPrimariaEnv = process.env.COR_PRIMARIA || process.env.PRIMARY_COLOR;
const corSecundariaEnv = process.env.COR_SECUNDARIA || process.env.SECONDARY_COLOR;

if (corPrimariaEnv && corSecundariaEnv) {
  const primaria = normalizarCor(corPrimariaEnv);
  const secundaria = normalizarCor(corSecundariaEnv);
  if (primaria && secundaria) {
    cores.primaria = primaria;
    cores.secundaria = secundaria;
    console.log('🎨 Usando cores das variáveis de ambiente:');
    console.log(`   Primária: ${cores.primaria}`);
    console.log(`   Secundária: ${cores.secundaria}`);
  }
} else if (args.length >= 2) {
  // Tentar obter dos argumentos
  const primaria = normalizarCor(args[0]);
  const secundaria = normalizarCor(args[1]);
  
  if (primaria && secundaria) {
    cores.primaria = primaria;
    cores.secundaria = secundaria;
    console.log('🎨 Usando cores fornecidas:');
    console.log(`   Primária: ${cores.primaria}`);
    console.log(`   Secundária: ${cores.secundaria}`);
  } else {
    console.log('❌ Erro: Cores inválidas fornecidas!');
    console.log('   As cores devem estar no formato hexadecimal (ex: FF6B6B ou #FF6B6B)');
    console.log('   Exemplo: npm run update-theme-colors FF6B6B 4ECDC4');
    process.exit(1);
  }
} else {
  console.log('⚠️  Usando cores padrão. Para usar cores personalizadas:');
  console.log('');
  console.log('   Opção 1 (com aspas para proteger o #):');
  console.log('   npm run update-theme-colors "#FF6B6B" "#4ECDC4"');
  console.log('');
  console.log('   Opção 2 (sem #, o script adiciona automaticamente):');
  console.log('   npm run update-theme-colors FF6B6B 4ECDC4');
  console.log('');
  console.log('   Opção 3 (usando variáveis de ambiente):');
  console.log('   COR_PRIMARIA=FF6B6B COR_SECUNDARIA=4ECDC4 npm run update-theme-colors');
}

// Função para escapar caracteres especiais em regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Função para substituir cores em um arquivo
function atualizarCoresNoArquivo(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modificado = false;
    const originalContent = content;

    replacements.forEach(({ de, para }) => {
      const corEscapada = escapeRegex(de);
      
      // 1. Substituir cores individuais (com e sem #)
      const regexCorSimples = new RegExp(corEscapada, 'gi');
      if (content.match(regexCorSimples)) {
        content = content.replace(regexCorSimples, para);
        modificado = true;
      }

      // 2. Substituir em gradientes completos
      // Padrão: linear-gradient(135deg, #COR1 0%, #COR2 100%)
      const gradientePattern = new RegExp(
        `linear-gradient\\(135deg,\\s*${corEscapada}\\s+0%,\\s*[^)]+\\s+100%\\)`,
        'gi'
      );
      content = content.replace(gradientePattern, (match) => {
        return match.replace(new RegExp(corEscapada, 'gi'), para);
      });

      // 3. Substituir em gradientes invertidos (cor2 primeiro)
      const gradienteInvertidoPattern = new RegExp(
        `linear-gradient\\(135deg,\\s*[^,]+,\\s*${corEscapada}\\s+[^)]+\\)`,
        'gi'
      );
      content = content.replace(gradienteInvertidoPattern, (match) => {
        return match.replace(new RegExp(corEscapada, 'gi'), para);
      });

      // 4. Substituir em qualquer gradiente que contenha a cor
      const qualquerGradiente = new RegExp(
        `linear-gradient\\([^)]*${corEscapada}[^)]*\\)`,
        'gi'
      );
      if (content.match(qualquerGradiente)) {
        content = content.replace(qualquerGradiente, (match) => {
          return match.replace(new RegExp(corEscapada, 'gi'), para);
        });
        modificado = true;
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${path.relative(process.cwd(), filePath)}`);
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

console.log('\n🔄 Atualizando cores do tema...\n');
console.log(`📋 Cores a substituir:`);
console.log(`   ${CORES_PADRAO.primaria} → ${cores.primaria}`);
console.log(`   ${CORES_PADRAO.secundaria} → ${cores.secundaria}\n`);

let atualizados = 0;
let naoEncontrados = 0;

arquivos.forEach(({ path: filePath, replacements }) => {
  if (fs.existsSync(filePath)) {
    if (atualizarCoresNoArquivo(filePath, replacements)) {
      atualizados++;
    } else {
      console.log(`ℹ️  Nenhuma alteração necessária: ${path.relative(process.cwd(), filePath)}`);
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${path.relative(process.cwd(), filePath)}`);
    naoEncontrados++;
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   ✅ ${atualizados} arquivo(s) atualizado(s)`);
if (naoEncontrados > 0) {
  console.log(`   ⚠️  ${naoEncontrados} arquivo(s) não encontrado(s)`);
}

if (atualizados > 0) {
  console.log('\n✅ Cores atualizadas com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Revisar as alterações nos arquivos');
  console.log('   2. Executar: cd client && npm run build');
  console.log('   3. Testar o site com as novas cores');
  console.log('\n💡 Dica: Use git diff para ver as alterações feitas');
} else {
  console.log('\n⚠️  Nenhum arquivo foi atualizado.');
  console.log('   Verifique se as cores fornecidas estão corretas.');
  console.log('   Exemplo: npm run update-theme-colors #FF6B6B #4ECDC4');
}
