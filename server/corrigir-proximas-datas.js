const mysql = require('mysql2/promise');
const { calcularProximaData } = require('./utils/dateCalculator');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'FLoc25GD!',
  database: 'partiu_ensaio'
};

async function corrigirProximasDatas() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    
    // Buscar todos os ensaios com dia_semana e semana_mes mas sem proxima_data válida
    const [ensaios] = await connection.query(
      'SELECT id, dia_semana, semana_mes, proxima_data FROM ensaios WHERE dia_semana IS NOT NULL AND semana_mes IS NOT NULL'
    );
    
    console.log(`📋 Encontrados ${ensaios.length} ensaios para verificar`);
    
    let atualizados = 0;
    let comErro = 0;
    
    for (const ensaio of ensaios) {
      try {
        // Normalizar dia_semana para minúsculas antes de calcular
        const diaSemanaNormalizado = ensaio.dia_semana ? ensaio.dia_semana.toLowerCase() : null;
        
        // Recalcular próxima data (sempre recalcular para garantir que está atualizada)
        const novaProximaData = calcularProximaData(diaSemanaNormalizado, parseInt(ensaio.semana_mes));
        
        if (novaProximaData) {
          // Sempre atualizar, mesmo se já existe uma data (para garantir que está correta)
          await connection.query(
            'UPDATE ensaios SET proxima_data = ? WHERE id = ?',
            [novaProximaData, ensaio.id]
          );
          const dataAntiga = ensaio.proxima_data ? (ensaio.proxima_data instanceof Date ? ensaio.proxima_data.toISOString().split('T')[0] : String(ensaio.proxima_data)) : 'NULL';
          console.log(`✅ Ensaio ${ensaio.id}: ${dataAntiga} → ${novaProximaData}`);
          atualizados++;
        } else {
          console.log(`⚠️  Ensaio ${ensaio.id}: Não foi possível calcular próxima data (dia_semana: "${ensaio.dia_semana}" -> "${diaSemanaNormalizado}", semana_mes: ${ensaio.semana_mes})`);
          comErro++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ensaio ${ensaio.id}:`, err.message);
        comErro++;
      }
    }
    
    console.log('');
    console.log(`✅ Processo concluído!`);
    console.log(`   Atualizados: ${atualizados}`);
    console.log(`   Com erro: ${comErro}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

corrigirProximasDatas();
