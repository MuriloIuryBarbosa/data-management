const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Iniciando migração de dados para tabelas de controle...');

    // 1. Migrar famílias
    console.log('\n1. Migrando famílias...');
    const [familias] = await conn.execute(`
      SELECT DISTINCT \`Codigo Familia\` as codigo_legado
      FROM tab_dados_faturamento
      WHERE \`Codigo Familia\` IS NOT NULL AND \`Codigo Familia\` != ''
      ORDER BY \`Codigo Familia\`
    `);

    for (const familia of familias) {
      const nome = `Família ${familia.codigo_legado.replace(',00', '')}`;
      await conn.execute(`
        INSERT IGNORE INTO familias_controle (codigo_legado, nome)
        VALUES (?, ?)
      `, [familia.codigo_legado, nome]);
    }
    console.log(`✅ Migradas ${familias.length} famílias`);

    // 2. Migrar cores
    console.log('\n2. Migrando cores...');
    const [cores] = await conn.execute(`
      SELECT DISTINCT \`Codigo Cor\` as codigo_legado
      FROM tab_dados_faturamento
      WHERE \`Codigo Cor\` IS NOT NULL AND \`Codigo Cor\` != ''
      ORDER BY \`Codigo Cor\`
    `);

    for (const cor of cores) {
      const nome = `Cor ${cor.codigo_legado.replace(',00', '')}`;
      await conn.execute(`
        INSERT IGNORE INTO cores_controle (codigo_legado, nome)
        VALUES (?, ?)
      `, [cor.codigo_legado, nome]);
    }
    console.log(`✅ Migradas ${cores.length} cores`);

    // 3. Migrar tamanhos
    console.log('\n3. Migrando tamanhos...');
    const [tamanhos] = await conn.execute(`
      SELECT DISTINCT \`Codigo Tam\` as codigo_legado
      FROM tab_dados_faturamento
      WHERE \`Codigo Tam\` IS NOT NULL AND \`Codigo Tam\` != ''
      ORDER BY \`Codigo Tam\`
    `);

    for (const tamanho of tamanhos) {
      const nome = `Tamanho ${tamanho.codigo_legado.replace(',00', '')}`;
      await conn.execute(`
        INSERT IGNORE INTO tamanhos_controle (codigo_legado, nome)
        VALUES (?, ?)
      `, [tamanho.codigo_legado, nome]);
    }
    console.log(`✅ Migrados ${tamanhos.length} tamanhos`);

    // 4. Migrar SKUs válidos (combinações família-cor-tamanho)
    console.log('\n4. Migrando SKUs válidos...');
    const [skus] = await conn.execute(`
      SELECT DISTINCT
        \`Codigo Familia\` as familia_codigo,
        \`Codigo Cor\` as cor_codigo,
        \`Codigo Tam\` as tamanho_codigo,
        SKU as sku_legado
      FROM tab_dados_faturamento
      WHERE \`Codigo Familia\` IS NOT NULL AND \`Codigo Familia\` != ''
        AND \`Codigo Cor\` IS NOT NULL AND \`Codigo Cor\` != ''
        AND \`Codigo Tam\` IS NOT NULL AND \`Codigo Tam\` != ''
        AND SKU IS NOT NULL AND SKU != ''
    `);

    let skusInseridos = 0;
    for (const sku of skus) {
      // Buscar IDs das tabelas de controle
      const [familiaResult] = await conn.execute(
        'SELECT id FROM familias_controle WHERE codigo_legado = ?',
        [sku.familia_codigo]
      );

      const [corResult] = await conn.execute(
        'SELECT id FROM cores_controle WHERE codigo_legado = ?',
        [sku.cor_codigo]
      );

      const [tamanhoResult] = await conn.execute(
        'SELECT id FROM tamanhos_controle WHERE codigo_legado = ?',
        [sku.tamanho_codigo]
      );

      if (familiaResult.length > 0 && corResult.length > 0 && tamanhoResult.length > 0) {
        await conn.execute(`
          INSERT IGNORE INTO skus_validos (familia_id, cor_id, tamanho_id, sku_legado)
          VALUES (?, ?, ?, ?)
        `, [familiaResult[0].id, corResult[0].id, tamanhoResult[0].id, sku.sku_legado]);
        skusInseridos++;
      }
    }
    console.log(`✅ Migrados ${skusInseridos} SKUs válidos`);

    // 5. Verificar resultados
    console.log('\n5. Verificando migração...');
    const [statsFamilias] = await conn.execute('SELECT COUNT(*) as total FROM familias_controle');
    const [statsCores] = await conn.execute('SELECT COUNT(*) as total FROM cores_controle');
    const [statsTamanhos] = await conn.execute('SELECT COUNT(*) as total FROM tamanhos_controle');
    const [statsSkus] = await conn.execute('SELECT COUNT(*) as total FROM skus_validos');

    console.log(`📊 Estatísticas da migração:`);
    console.log(`   Famílias: ${statsFamilias[0].total}`);
    console.log(`   Cores: ${statsCores[0].total}`);
    console.log(`   Tamanhos: ${statsTamanhos[0].total}`);
    console.log(`   SKUs válidos: ${statsSkus[0].total}`);

    console.log('\n✅ Migração concluída com sucesso!');

  } finally {
    conn.end();
  }
}

migrateData().catch(console.error);