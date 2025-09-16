const mysql = require('mysql2/promise');
require('dotenv').config();

async function somarValorQtdeFaturamento() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Calculando soma das colunas VALOR e QTDE na tabela tab_dados_faturamento...');

    // Query para somar VALOR e QTDE
    const [result] = await conn.execute(`
      SELECT
        SUM(CAST(VALOR AS DECIMAL(15,2))) as soma_valor,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as soma_qtde,
        COUNT(*) as total_registros
      FROM tab_dados_faturamento
      WHERE INDICADOR = 'Faturamento'
        AND VALOR IS NOT NULL
        AND QTDE IS NOT NULL
        AND VALOR != ''
        AND QTDE != ''
    `);

    const dados = result[0];

    console.log('✅ Resultado da soma:');
    console.log(`📊 Total de registros processados: ${dados.total_registros}`);
    console.log(`💰 Soma da coluna VALOR: R$ ${dados.soma_valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`);
    console.log(`📦 Soma da coluna QTDE: ${dados.soma_qtde?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`);

    // Também mostrar estatísticas por empresa
    console.log('\n📈 Estatísticas por empresa:');
    const [resultPorEmpresa] = await conn.execute(`
      SELECT
        Empresa,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as soma_valor,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as soma_qtde,
        COUNT(*) as total_registros
      FROM tab_dados_faturamento
      WHERE INDICADOR = 'Faturamento'
        AND VALOR IS NOT NULL
        AND QTDE IS NOT NULL
        AND VALOR != ''
        AND QTDE != ''
      GROUP BY Empresa
      ORDER BY soma_valor DESC
    `);

    resultPorEmpresa.forEach((row, index) => {
      console.log(`${index + 1}. Empresa ${row.Empresa}:`);
      console.log(`   Valor: R$ ${row.soma_valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`);
      console.log(`   Quantidade: ${row.soma_qtde?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`);
      console.log(`   Registros: ${row.total_registros}`);
    });

  } catch (error) {
    console.error('❌ Erro ao calcular soma:', error);
  } finally {
    conn.end();
  }
}

somarValorQtdeFaturamento().catch(console.error);