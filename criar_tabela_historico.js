const mysql = require('mysql2/promise');

async function criarTabelaHistorico() {
  let connection;

  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456789',
      database: 'datalake'
    });

    console.log('✅ Conectado ao banco de dados');

    // SQL para criar a tabela
    const sql = `
      CREATE TABLE IF NOT EXISTS ordem_compra_historico (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ordem_compra_id INT NOT NULL,
        campo_alterado VARCHAR(100) NOT NULL,
        valor_anterior TEXT,
        valor_novo TEXT,
        usuario_id INT,
        usuario_nome VARCHAR(255),
        data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
        tipo_alteracao ENUM('criacao', 'edicao', 'exclusao') DEFAULT 'edicao',
        FOREIGN KEY (ordem_compra_id) REFERENCES ordem_compra(id) ON DELETE CASCADE,
        INDEX idx_ordem_compra_id (ordem_compra_id),
        INDEX idx_data_alteracao (data_alteracao)
      )
    `;

    // Executar o SQL
    await connection.execute(sql);
    console.log('✅ Tabela ordem_compra_historico criada/verificada com sucesso');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

criarTabelaHistorico();