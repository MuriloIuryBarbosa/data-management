const mysql = require('mysql2/promise');
const fs = require('fs');

async function executarMigracao() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456789',
      database: 'datalake',
      multipleStatements: true
    });

    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sql = fs.readFileSync('migracao_oc_multi_itens.sql', 'utf8');

    // Executar a migração
    console.log('🔄 Executando migração...');
    await connection.execute(sql);

    console.log('✅ Migração executada com sucesso!');

    // Verificar se as tabelas foram criadas
    const [tables] = await connection.execute("SHOW TABLES LIKE 'ordem_compra_itens'");
    if (tables.length > 0) {
      console.log('✅ Tabela ordem_compra_itens criada');

      // Verificar estrutura da tabela
      const [columns] = await connection.execute('DESCRIBE ordem_compra_itens');
      console.log('📋 Estrutura da tabela ordem_compra_itens:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

executarMigracao();