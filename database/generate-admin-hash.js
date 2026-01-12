// Script para gerar hash bcrypt da senha do admin
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }
  
  console.log('====================================');
  console.log('Hash gerado com sucesso!');
  console.log('====================================');
  console.log('Senha:', password);
  console.log('Hash:', hash);
  console.log('====================================');
  console.log('\nUse este hash no arquivo mysql-insert-admin.sql');
  console.log('ou execute:');
  console.log(`  UPDATE users SET password = '${hash}' WHERE email = 'admin@partiuensaio.com';`);
});
