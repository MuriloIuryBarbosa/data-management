const mysql = require('mysql2/promise');
require('dotenv').config();

async function testNewQueries() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Testando novas queries com tabelas de controle...\n');

    // Exemplo 1: Análise de faturamento com nomes descritivos
    console.log('1. Análise de faturamento com nomes descritivos:');
    const [faturamentoComNomes] = await conn.execute(`
      SELECT
        f.nome as familia_nome,
        c.nome as cor_nome,
        t.nome as tamanho_nome,
        SUM(CAST(tf.VALOR AS DECIMAL(15,2))) as valor_total,
        SUM(CAST(tf.QTDE AS DECIMAL(15,2))) as quantidade_total,
        COUNT(*) as registros
      FROM tab_dados_faturamento tf
      JOIN familias_controle f ON tf.\`Codigo Familia\` = f.codigo_legado
      JOIN cores_controle c ON tf.\`Codigo Cor\` = c.codigo_legado
      JOIN tamanhos_controle t ON tf.\`Codigo Tam\` = t.codigo_legado
      WHERE tf.INDICADOR = 'Faturamento'
        AND tf.Ano = '2023,00'
        AND tf.Mes = '1,00'
      GROUP BY f.id, c.id, t.id, f.nome, c.nome, t.nome
      ORDER BY valor_total DESC
      LIMIT 10
    `);

    faturamentoComNomes.forEach((row, i) => {
      console.log(`${i+1}. ${row.familia_nome} - ${row.cor_nome} - ${row.tamanho_nome}: R$ ${row.valor_total} (${row.quantidade_total} unidades)`);
    });

    // Exemplo 2: SKUs válidos com informações completas
    console.log('\n2. SKUs válidos com informações completas:');
    const [skusCompletos] = await conn.execute(`
      SELECT
        sv.sku_legado,
        f.nome as familia,
        c.nome as cor,
        t.nome as tamanho,
        f.codigo_legado as familia_codigo,
        c.codigo_legado as cor_codigo,
        t.codigo_legado as tamanho_codigo
      FROM skus_validos sv
      JOIN familias_controle f ON sv.familia_id = f.id
      JOIN cores_controle c ON sv.cor_id = c.id
      JOIN tamanhos_controle t ON sv.tamanho_id = t.id
      WHERE sv.ativo = 1
      ORDER BY sv.sku_legado
      LIMIT 10
    `);

    skusCompletos.forEach((row, i) => {
      console.log(`${i+1}. SKU ${row.sku_legado}: ${row.familia} (${row.familia_codigo}) - ${row.cor} (${row.cor_codigo}) - ${row.tamanho} (${row.tamanho_codigo})`);
    });

    // Exemplo 3: Análise de giro de estoque com nomes
    console.log('\n3. Análise de giro de estoque com nomes:');
    const [giroComNomes] = await conn.execute(`
      SELECT
        f.nome as familia,
        f.codigo_legado as familia_codigo,
        SUM(CAST(te.VALOR AS DECIMAL(15,2))) as valor_estoque,
        SUM(CAST(tf.VALOR AS DECIMAL(15,2))) as valor_faturamento,
        ROUND(
          CASE
            WHEN SUM(CAST(te.VALOR AS DECIMAL(15,2))) > 0
            THEN SUM(CAST(tf.VALOR AS DECIMAL(15,2))) / SUM(CAST(te.VALOR AS DECIMAL(15,2)))
            ELSE 0
          END, 2
        ) as giro_estoque
      FROM familias_controle f
      LEFT JOIN tab_dados_estoque te ON f.codigo_legado = te.\`Codigo Familia\` AND te.INDICADOR = 'Estoque'
      LEFT JOIN tab_dados_faturamento tf ON f.codigo_legado = tf.\`Codigo Familia\` AND tf.INDICADOR = 'Faturamento'
      WHERE f.ativo = 1
      GROUP BY f.id, f.nome, f.codigo_legado
      HAVING valor_estoque > 0 OR valor_faturamento > 0
      ORDER BY giro_estoque DESC
      LIMIT 10
    `);

    giroComNomes.forEach((row, i) => {
      console.log(`${i+1}. ${row.familia} (${row.familia_codigo}): Giro ${row.giro_estoque}x (Estoque: R$ ${row.valor_estoque || 0}, Faturamento: R$ ${row.valor_faturamento || 0})`);
    });

    console.log('\n✅ Testes das novas queries concluídos!');

  } finally {
    conn.end();
  }
}

testNewQueries().catch(console.error);