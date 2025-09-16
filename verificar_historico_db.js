const mysql = require('mysql2/promise');

async function verificarHistorico() {
  let connection;

  try {
    // Conectar ao banco de dados usando as configurações corretas
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456789',
      database: 'datalake'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'ordem_compra_historico'"
    );

    if (tables.length === 0) {
      console.log('❌ Tabela ordem_compra_historico não encontrada');
      return;
    }

    console.log('✅ Tabela ordem_compra_historico existe');

    // Verificar estrutura da tabela
    const [columns] = await connection.execute(
      "DESCRIBE ordem_compra_historico"
    );

    console.log('📋 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Verificar se há registros
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as total FROM ordem_compra_historico"
    );

    console.log(`📊 Total de registros no histórico: ${rows[0].total}`);

    if (rows[0].total > 0) {
      // Mostrar alguns registros recentes
      const [historico] = await connection.execute(
        "SELECT * FROM ordem_compra_historico ORDER BY data_alteracao DESC LIMIT 5"
      );

      console.log('📝 Últimos registros do histórico:');
      historico.forEach(reg => {
        console.log(`  - ID: ${reg.id}, Ordem: ${reg.ordem_compra_id}, Campo: ${reg.campo_alterado}`);
        console.log(`    Antes: ${reg.valor_anterior}, Depois: ${reg.valor_novo}`);
        console.log(`    Usuário: ${reg.usuario_nome}, Data: ${reg.data_alteracao}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

verificarHistorico();