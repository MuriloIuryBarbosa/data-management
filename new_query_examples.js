// Nova versão da função getAnaliseFaturamento usando tabelas de controle
async function getAnaliseFaturamentoComControle(familia?: string, cor?: string, tamanho?: string, empresa?: string, ano?: string, mes?: string) {
  const conn = await pool.getConnection();
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

    // Resumo por período com nomes
    const [resumoPeriodo] = await conn.execute(`
      SELECT
        tf.Ano,
        tf.Mes,
        SUM(CAST(tf.QTDE AS DECIMAL(15,2))) as quantidade_total,
        SUM(CAST(tf.VALOR AS DECIMAL(15,2))) as valor_total,
        COUNT(DISTINCT f.id) as familias_ativas,
        COUNT(DISTINCT c.id) as cores_ativas,
        COUNT(DISTINCT t.id) as tamanhos_ativos,
        COUNT(DISTINCT tf.Empresa) as empresas_ativas
      FROM tab_dados_faturamento tf
      LEFT JOIN familias_controle f ON tf.\`Codigo Familia\` = f.codigo_legado
      LEFT JOIN cores_controle c ON tf.\`Codigo Cor\` = c.codigo_legado
      LEFT JOIN tamanhos_controle t ON tf.\`Codigo Tam\` = t.codigo_legado
      ${whereClause.replace('WHERE tf.INDICADOR = "Faturamento"', 'WHERE tf.INDICADOR = "Faturamento"')}
      GROUP BY tf.Ano, tf.Mes
      ORDER BY tf.Ano DESC, tf.Mes DESC
      LIMIT 12
    `, params);

    return {
      faturamentoTemporal,
      resumoPeriodo
    };
  } finally {
    conn.release();
  }
}

// Nova versão da função getAnaliseGiroEstoque usando tabelas de controle
async function getAnaliseGiroEstoqueComControle(ano?: string, mes?: string, familia?: string) {
  const conn = await pool.getConnection();
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
    conn.release();
  }
}