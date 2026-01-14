const fs = require('fs');
const path = require('path');

const CORES_PADRAO = {
  primaria: '#667eea',
  secundaria: '#764ba2'
};

const arquivos = [
  path.join(__dirname, '../client/public/manifest.json'),
  path.join(__dirname, '../client/public/index.html'),
  path.join(__dirname, '../client/src/index.css'),
  path.join(__dirname, '../client/src/components/Login.css'),
  path.join(__dirname, '../client/src/components/Dashboard.css'),
  path.join(__dirname, '../client/src/components/InstallPrompt.css')
];

console.log('🔍 Verificando cores nos arquivos...\n');

let encontradas = {
  primaria: 0,
  secundaria: 0
};

arquivos.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const primariaMatches = (content.match(new RegExp(CORES_PADRAO.primaria.replace('#', '\\#'), 'gi')) || []).length;
    const secundariaMatches = (content.match(new RegExp(CORES_PADRAO.secundaria.replace('#', '\\#'), 'gi')) || []).length;
    
    if (primariaMatches > 0 || secundariaMatches > 0) {
      console.log(`📄 ${path.relative(process.cwd(), filePath)}:`);
      if (primariaMatches > 0) {
        console.log(`   ⚠️  Encontrada cor primária antiga (${primariaMatches} ocorrências): ${CORES_PADRAO.primaria}`);
        encontradas.primaria += primariaMatches;
      }
      if (secundariaMatches > 0) {
        console.log(`   ⚠️  Encontrada cor secundária antiga (${secundariaMatches} ocorrências): ${CORES_PADRAO.secundaria}`);
        encontradas.secundaria += secundariaMatches;
      }
    }
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   Cor primária antiga encontrada: ${encontradas.primaria} vezes`);
console.log(`   Cor secundária antiga encontrada: ${encontradas.secundaria} vezes`);

if (encontradas.primaria > 0 || encontradas.secundaria > 0) {
  console.log(`\n⚠️  Ainda há cores antigas nos arquivos!`);
  console.log(`   Execute: npm run update-theme-colors COR1 COR2`);
  console.log(`   Exemplo: npm run update-theme-colors FF6B6B 4ECDC4`);
} else {
  console.log(`\n✅ Nenhuma cor antiga encontrada!`);
}
