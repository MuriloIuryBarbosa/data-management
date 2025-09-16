import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runEssentialMigration() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_management',
    });

    console.log('Connected to database. Running essential migration...');

    // Execute essential ALTER TABLE commands
    const essentialCommands = [
      `ALTER TABLE ordem_compra ADD COLUMN numero_oc VARCHAR(50) UNIQUE`,
      `ALTER TABLE ordem_compra ADD COLUMN fornecedor VARCHAR(255)`,
      `ALTER TABLE ordem_compra ADD COLUMN data_emissao DATE DEFAULT (CURRENT_DATE)`,
      `ALTER TABLE ordem_compra ADD COLUMN data_entrega_prevista DATE`,
      `ALTER TABLE ordem_compra ADD COLUMN observacoes TEXT`,
      `ALTER TABLE ordem_compra ADD COLUMN valor_total_brl DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE ordem_compra ADD COLUMN valor_total_usd DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE ordem_compra ADD COLUMN status ENUM('rascunho', 'emitida', 'aprovada', 'em_transito', 'recebida', 'cancelada') DEFAULT 'rascunho'`,

      `ALTER TABLE ordem_compra_itens ADD COLUMN numero_oc VARCHAR(50)`,
      `ALTER TABLE ordem_compra_itens ADD CONSTRAINT fk_ordem_compra_itens_numero_oc FOREIGN KEY (numero_oc) REFERENCES ordem_compra(numero_oc) ON DELETE CASCADE`,

      `CREATE TABLE IF NOT EXISTS ordem_compra_itens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_oc VARCHAR(50) NOT NULL,
        familia_id INT NOT NULL,
        tamanho_id INT NOT NULL,
        cor_id INT NOT NULL,
        sku VARCHAR(255),
        quantidade DECIMAL(10,2) NOT NULL,
        unidade_medida VARCHAR(50) DEFAULT 'un',
        valor_unitario_brl DECIMAL(10,2),
        valor_total_brl DECIMAL(10,2),
        cotacao_dolar DECIMAL(10,2),
        valor_unitario_usd DECIMAL(10,2),
        valor_total_usd DECIMAL(10,2),
        etd_planejado DATE,
        etd_proposto DATE,
        etd_real DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (numero_oc) REFERENCES ordem_compra(numero_oc) ON DELETE CASCADE,
        FOREIGN KEY (familia_id) REFERENCES familia(id),
        FOREIGN KEY (tamanho_id) REFERENCES tamanho(id),
        FOREIGN KEY (cor_id) REFERENCES cor(id)
      )`
    ];

    for (const command of essentialCommands) {
      try {
        console.log('Executing:', command.substring(0, 60) + '...');
        await connection.execute(command);
        console.log('✓ Success');
      } catch (error: any) {
        // Ignore "Duplicate column" and "Duplicate foreign key" errors
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_FK_DUP_NAME') {
          console.log('⚠ Already exists, skipping...');
        } else {
          throw error;
        }
      }
    }

    console.log('Essential migration completed successfully!');
    await connection.end();

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runEssentialMigration();