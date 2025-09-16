const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Analisar estrutura das tabelas tab_dados_*
    const tables = ['tab_dados_faturamento', 'tab_dados_estoque', 'tab_dados_business_plan'];

    for (const table of tables) {
      console.log(`\n=== Estrutura da tabela: ${table} ===`);

      // Descrever estrutura
      const [columns] = await conn.execute(`DESCRIBE ${table}`);
      console.log('Colunas:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });

      // Mostrar amostra de dados
      const [sample] = await conn.execute(`SELECT * FROM ${table} LIMIT 3`);
      console.log(`\nAmostra de dados (${sample.length} registros):`);
      if (sample.length > 0) {
        console.log('Campos encontrados:', Object.keys(sample[0]));
        sample.forEach((row, i) => {
          console.log(`Registro ${i+1}:`, JSON.stringify(row, null, 2));
        });
      }
    }

    // Analisar valores únicos nos campos de família, cor e tamanho
    console.log('\n=== Valores únicos nos campos de controle ===');

    const fields = [
      { table: 'tab_dados_faturamento', field: 'Codigo Familia', alias: 'familias' },
      { table: 'tab_dados_faturamento', field: 'Codigo Cor', alias: 'cores' },
      { table: 'tab_dados_faturamento', field: 'Codigo Tam', alias: 'tamanhos' }
    ];

    for (const { table, field, alias } of fields) {
      const [unique] = await conn.execute(
        `SELECT DISTINCT \`${field}\` as valor FROM ${table} WHERE \`${field}\` IS NOT NULL AND \`${field}\` != '' ORDER BY \`${field}\` LIMIT 10`
      );
      console.log(`\n${alias.toUpperCase()} (${unique.length} únicos, mostrando primeiros 10):`);
      unique.forEach(row => console.log(`  '${row.valor}'`));
    }

  } finally {
    conn.end();
  }
}

analyzeTables().catch(console.error);