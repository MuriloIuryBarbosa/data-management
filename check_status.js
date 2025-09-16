const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_management'
    });

    const [rows] = await conn.execute('SELECT id, status, sku FROM ordem_compra ORDER BY id DESC LIMIT 5');
    console.log('Status das últimas ordens de compra:');
    rows.forEach(row => console.log(`ID: ${row.id}, Status: ${row.status}, SKU: ${row.sku || 'N/A'}`));

    conn.end();
  } catch (err) {
    console.error('Erro:', err.message);
  }
})();