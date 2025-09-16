// Exemplos de novas queries usando tabelas de controle
// Este arquivo demonstra como atualizar as funções existentes

import mysql from 'mysql2/promise';

// Nova versão da função getAnaliseFaturamento usando tabelas de controle
async function getAnaliseFaturamentoComControle(
  familia?: string,
  cor?: string,
  tamanho?: string,
  empresa?: string,
  ano?: string,
  mes?: string
) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let whereClause = 'WHERE tf.INDICADOR = "Faturamento"';
    const params: any[] = [];

    // Aplicar filtros usando códigos legados
    if (familia) {
      whereClause += ' AND tf.`Codigo Familia` = ?';
      params.push(familia);
    }
    if (cor) {
      whereClause += ' AND tf.`Codigo Cor` = ?';
      params.push(cor);
    }
    if (tamanho) {
      whereClause += ' AND tf.`Codigo Tam` = ?';
      params.push(tamanho);
    }
    if (empresa) {
      whereClause += ' AND tf.Empresa = ?';
      params.push(empresa);
    }
    if (ano) {
      whereClause += ' AND tf.Ano = ?';
      params.push(ano);
    }
    if (mes) {
      whereClause += ' AND tf.Mes = ?';
      params.push(mes);
    }

    // Análise temporal de faturamento com nomes descritivos
    const [faturamentoTemporal] = await conn.execute(`
      SELECT
        tf.Ano,
        tf.Mes,
        f.nome as familia_nome,
        c.nome as cor_nome,
        t.nome as tamanho_nome,
        tf.Empresa,
        SUM(CAST(tf.QTDE AS DECIMAL(15,2))) as quantidade_total,
        SUM(CAST(tf.VALOR AS DECIMAL(15,2))) as valor_total,
        AVG(CAST(tf.VALOR AS DECIMAL(15,2))) as valor_medio,
        COUNT(*) as numero_registros,
        -- Manter códigos legados para referência
        tf.\`Codigo Familia\` as familia_codigo,
        tf.\`Codigo Cor\` as cor_codigo,
        tf.\`Codigo Tam\` as tamanho_codigo
      FROM tab_dados_faturamento tf
      LEFT JOIN familias_controle f ON tf.\`Codigo Familia\` = f.codigo_legado
      LEFT JOIN cores_controle c ON tf.\`Codigo Cor\` = c.codigo_legado
      LEFT JOIN tamanhos_controle t ON tf.\`Codigo Tam\` = t.codigo_legado
      ${whereClause}
      GROUP BY tf.Ano, tf.Mes, f.id, c.id, t.id, f.nome, c.nome, t.nome, tf.Empresa,
               tf.\`Codigo Familia\`, tf.\`Codigo Cor\`, tf.\`Codigo Tam\`
      ORDER BY tf.Ano DESC, tf.Mes DESC, valor_total DESC
      LIMIT 100
    `, params);

    return {
      faturamentoTemporal
    };
  } finally {
    conn.end();
  }
}

// Nova versão da função getAnaliseGiroEstoque usando tabelas de controle
async function getAnaliseGiroEstoqueComControle(ano?: string, mes?: string, familia?: string) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (ano) {
      whereClause += ' AND Ano = ?';
      params.push(ano);
    }
    if (mes) {
      whereClause += ' AND Mes = ?';
      params.push(mes);
    }
    if (familia) {
      whereClause += ' AND `Codigo Familia` = ?';
      params.push(familia);
    }

    // Calcular giro de estoque com nomes descritivos
    const [giroEstoque] = await conn.execute(`
      SELECT
        f.nome as familia_nome,
        f.codigo_legado as familia_codigo,
        COALESCE(estoque_valor, 0) as estoque_valor,
        COALESCE(faturamento_valor, 0) as faturamento_valor,
        CASE
          WHEN COALESCE(estoque_valor, 0) > 0
          THEN ROUND(COALESCE(faturamento_valor, 0) / estoque_valor, 2)
          ELSE 0
        END as giro_estoque,
        CASE
          WHEN COALESCE(faturamento_valor, 0) > 0
          THEN ROUND((COALESCE(estoque_valor, 0) / faturamento_valor) * 365, 0)
          ELSE 0
        END as dias_estoque
      FROM familias_controle f
      LEFT JOIN (
        SELECT \`Codigo Familia\` as familia_codigo, SUM(CAST(VALOR AS DECIMAL(15,2))) as estoque_valor
        FROM tab_dados_estoque
        ${whereClause.replace('WHERE 1=1', 'WHERE INDICADOR = "Estoque"')}
        GROUP BY \`Codigo Familia\`
      ) e ON f.codigo_legado = e.familia_codigo
      LEFT JOIN (
        SELECT \`Codigo Familia\` as familia_codigo, SUM(CAST(VALOR AS DECIMAL(15,2))) as faturamento_valor
        FROM tab_dados_faturamento
        ${whereClause.replace('WHERE 1=1', 'WHERE INDICADOR = "Faturamento"')}
        GROUP BY \`Codigo Familia\`
      ) ft ON f.codigo_legado = ft.familia_codigo
      WHERE f.ativo = 1
        ${familia ? ' AND f.codigo_legado = ?' : ''}
      ORDER BY giro_estoque DESC
      LIMIT 20
    `, familia ? [...params, familia] : params);

    return giroEstoque;
  } finally {
    conn.end();
  }
}

// Exemplo de uso das novas funções
async function exemploUso() {
  try {
    console.log('=== Exemplos de uso das novas queries ===');

    // Exemplo 1: Faturamento com nomes descritivos
    const faturamento = await getAnaliseFaturamentoComControle(
      undefined, // familia
      undefined, // cor
      undefined, // tamanho
      undefined, // empresa
      '2023,00', // ano
      '1,00'     // mes
    );

    console.log('Faturamento Janeiro 2023:');
    (faturamento.faturamentoTemporal as any[]).slice(0, 5).forEach((item: any, i: number) => {
      console.log(`${i+1}. ${item.familia_nome} - ${item.cor_nome} - ${item.tamanho_nome}: R$ ${item.valor_total}`);
    });

    // Exemplo 2: Giro de estoque com nomes
    const giro = await getAnaliseGiroEstoqueComControle('2023,00', '1,00');

    console.log('\\nGiro de Estoque Janeiro 2023:');
    (giro as any[]).slice(0, 5).forEach((item: any, i: number) => {
      console.log(`${i+1}. ${item.familia_nome}: ${item.giro_estoque}x (${item.dias_estoque} dias)`);
    });

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  require('dotenv').config();
  exemploUso();
}

export {
  getAnaliseFaturamentoComControle,
  getAnaliseGiroEstoqueComControle
};