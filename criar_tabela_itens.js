const mysql = require('mysql2/promise');

async function criarTabelaItens() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456789',
      database: 'datalake'
    });

    console.log('✅ Conectado ao banco de dados');

    // Criar tabela de itens da ordem de compra
    const sql = `
      CREATE TABLE IF NOT EXISTS ordem_compra_itens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ordem_compra_id INT NOT NULL,
        familia_id INT NOT NULL,
        tamanho_id INT NOT NULL,
        cor_id INT NOT NULL,
        sku VARCHAR(255),
        quantidade INT NOT NULL,
        unidade_medida VARCHAR(50) DEFAULT 'un',
        valor_unitario_brl DECIMAL(10,2),
        valor_total_brl DECIMAL(10,2),
        cotacao_dolar DECIMAL(10,2),
        valor_unitario_usd DECIMAL(10,2),
        valor_total_usd DECIMAL(10,2),
        etd_planejado DATE,
        etd_proposto DATE,
        etd_real DATE,
        status ENUM('pendente', 'aprovado', 'em_transito', 'recebido', 'cancelado') DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (ordem_compra_id) REFERENCES ordem_compra(id) ON DELETE CASCADE,
        FOREIGN KEY (familia_id) REFERENCES familia(id),
        FOREIGN KEY (tamanho_id) REFERENCES tamanho(id),
        FOREIGN KEY (cor_id) REFERENCES cor(id),

        INDEX idx_ordem_compra_id (ordem_compra_id),
        INDEX idx_familia_id (familia_id),
        INDEX idx_tamanho_id (tamanho_id),
        INDEX idx_cor_id (cor_id),
        INDEX idx_status (status)
      )
    `;

    await connection.execute(sql);
    console.log('✅ Tabela ordem_compra_itens criada com sucesso');

    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE ordem_compra_itens');
    console.log('📋 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

criarTabelaItens();