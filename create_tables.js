const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Criando tabelas de controle...');

    // Criar tabela familias_controle
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS familias_controle (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo_legado VARCHAR(20) NOT NULL UNIQUE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo_legado (codigo_legado),
        INDEX idx_ativo (ativo)
      )
    `);
    console.log('✅ Tabela familias_controle criada');

    // Criar tabela cores_controle
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS cores_controle (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo_legado VARCHAR(20) NOT NULL UNIQUE,
        nome VARCHAR(100) NOT NULL,
        sigla VARCHAR(10),
        rgb_hex VARCHAR(7),
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo_legado (codigo_legado),
        INDEX idx_ativo (ativo),
        INDEX idx_sigla (sigla)
      )
    `);
    console.log('✅ Tabela cores_controle criada');

    // Criar tabela tamanhos_controle
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tamanhos_controle (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo_legado VARCHAR(20) NOT NULL UNIQUE,
        nome VARCHAR(100) NOT NULL,
        sigla VARCHAR(10),
        ordem INT,
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo_legado (codigo_legado),
        INDEX idx_ativo (ativo),
        INDEX idx_ordem (ordem)
      )
    `);
    console.log('✅ Tabela tamanhos_controle criada');

    // Criar tabela skus_validos
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS skus_validos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        familia_id INT NOT NULL,
        cor_id INT NOT NULL,
        tamanho_id INT NOT NULL,
        sku_legado VARCHAR(20),
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (familia_id) REFERENCES familias_controle(id),
        FOREIGN KEY (cor_id) REFERENCES cores_controle(id),
        FOREIGN KEY (tamanho_id) REFERENCES tamanhos_controle(id),
        UNIQUE KEY unique_sku_combination (familia_id, cor_id, tamanho_id),
        INDEX idx_familia_cor_tamanho (familia_id, cor_id, tamanho_id),
        INDEX idx_sku_legado (sku_legado),
        INDEX idx_ativo (ativo)
      )
    `);
    console.log('✅ Tabela skus_validos criada');

    console.log('✅ Todas as tabelas criadas com sucesso!');

  } finally {
    conn.end();
  }
}

createTables().catch(console.error);