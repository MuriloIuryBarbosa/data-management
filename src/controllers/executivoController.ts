import { Request, Response } from 'express';
import { pool } from '../models/database';

// Executivo Controllers
export const getAnaliseEstoque = async (req: Request, res: Response) => {
  try {
    // Filtros da query string
    const filtroMaterial = req.query.material as string;
    const filtroLocalizacao = req.query.localizacao as string;
    const filtroFamilia = req.query.familia as string;
    const filtroCor = req.query.cor as string;
    const filtroTamanho = req.query.tamanho as string;
    const filtroEmpresa = req.query.empresa as string;
    const filtroAno = req.query.ano as string;
    const filtroMes = req.query.mes as string;

    // Buscar estatísticas gerais
    const estatisticas = await getEstatisticasGerais();

    // Buscar dados agregados por material
    const dadosPorMaterial = await getDadosPorMaterial(filtroMaterial, filtroLocalizacao, filtroFamilia);

    // Buscar dados agregados por localização
    const dadosPorLocalizacao = await getDadosPorLocalizacao(filtroMaterial, filtroLocalizacao, filtroFamilia);

    // Buscar dados agregados por família
    const dadosPorFamilia = await getDadosPorFamilia(filtroMaterial, filtroLocalizacao, filtroFamilia);

    // Buscar lista de filtros disponíveis
    const filtrosDisponiveis = await getFiltrosDisponiveis();

    // NOVAS ANÁLISES COM TAB_DADOS_

    // 1. Análise de Giro de Estoque
    const analiseGiroEstoque = await getAnaliseGiroEstoque(filtroAno, filtroMes, filtroFamilia);

    // 2. Análise de Performance vs Business Plan
    const analiseBusinessPlan = await getAnaliseBusinessPlan(filtroAno, filtroMes, filtroFamilia);

    // 3. Análise de Disponibilidade de Produtos
    const analiseDisponibilidade = await getAnaliseDisponibilidade(filtroFamilia);

    // 4. Análise de Ordens de Compra Pendentes
    const analiseOcPendente = await getAnaliseOcPendente(filtroFamilia);

    // 5. Indicadores Financeiros
    const indicadoresFinanceiros = await getIndicadoresFinanceiros(filtroAno, filtroMes);

    // 6. Análise de Faturamento (NOVO)
    const analiseFaturamento = await getAnaliseFaturamento(filtroFamilia, filtroCor, filtroTamanho, filtroEmpresa, filtroAno, filtroMes);

    // 7. Filtros disponíveis para os novos campos
    const filtrosEstoque = await getFiltrosEstoque();

    res.render('executivo/analise-estoque/index', {
      estatisticas,
      dadosPorMaterial,
      dadosPorLocalizacao,
      dadosPorFamilia,
      filtrosDisponiveis,
      // Novas análises
      analiseGiroEstoque,
      analiseBusinessPlan,
      analiseDisponibilidade,
      analiseOcPendente,
      indicadoresFinanceiros,
      analiseFaturamento,
      filtrosEstoque,
      filtrosAtivos: {
        material: filtroMaterial,
        localizacao: filtroLocalizacao,
        familia: filtroFamilia,
        cor: filtroCor,
        tamanho: filtroTamanho,
        empresa: filtroEmpresa,
        ano: filtroAno,
        mes: filtroMes
      },
      title: 'Análise de Estoque',
      currentPage: 'analise-estoque',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    console.error('Erro ao buscar dados de análise de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de análise de estoque' });
  }
};// Função para buscar estatísticas gerais
async function getEstatisticasGerais() {
  const conn = await pool.getConnection();
  try {
    // Total de produtos únicos
    const [totalProdutosResult] = await conn.execute(`
      SELECT COUNT(DISTINCT produto_unico) as total
      FROM (
        SELECT CONCAT('tecido-', codigo_produto) as produto_unico FROM estoque_tecido01
        UNION
        SELECT CONCAT('fatex-', codigo, '-', familia) as produto_unico FROM estoque_fatex01
        UNION
        SELECT CONCAT('confec-', codigo, '-', familia) as produto_unico FROM estoque_confec01
        UNION
        SELECT CONCAT('estsc-', codigo, '-', familia) as produto_unico FROM estoque_estsc01
      ) as produtos_unicos
    `);

    // Peso total em toneladas
    const [pesoTotalResult] = await conn.execute(`
      SELECT ROUND(SUM(peso) / 1000, 2) as total_peso
      FROM (
        SELECT peso FROM estoque_tecido01 WHERE peso IS NOT NULL
        UNION ALL
        SELECT peso_bruto as peso FROM estoque_fatex01 WHERE peso_bruto IS NOT NULL
        UNION ALL
        SELECT peso_bruto as peso FROM estoque_confec01 WHERE peso_bruto IS NOT NULL
        UNION ALL
        SELECT peso_bruto as peso FROM estoque_estsc01 WHERE peso_bruto IS NOT NULL
      ) as pesos
    `);

    // Total de localizações
    const [totalLocalizacoesResult] = await conn.execute(`
      SELECT COUNT(DISTINCT localizacao) as total
      FROM (
        SELECT localizacao FROM estoque_tecido01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_fatex01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_confec01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_estsc01 WHERE localizacao IS NOT NULL AND localizacao != ''
      ) as localizacoes
    `);

    // Total de famílias
    const [totalFamiliasResult] = await conn.execute(`
      SELECT COUNT(DISTINCT familia) as total
      FROM (
        SELECT familia FROM estoque_fatex01 WHERE familia IS NOT NULL AND familia != ''
        UNION
        SELECT familia FROM estoque_confec01 WHERE familia IS NOT NULL AND familia != ''
        UNION
        SELECT familia FROM estoque_estsc01 WHERE familia IS NOT NULL AND familia != ''
      ) as familias
    `);

    return {
      totalProdutos: (totalProdutosResult as any)[0].total || 0,
      pesoTotal: (pesoTotalResult as any)[0].total_peso || 0,
      totalLocalizacoes: (totalLocalizacoesResult as any)[0].total || 0,
      totalFamilias: (totalFamiliasResult as any)[0].total || 0
    };
  } finally {
    conn.release();
  }
}

// Função para buscar dados agregados por material
async function getDadosPorMaterial(filtroMaterial?: string, filtroLocalizacao?: string, filtroFamilia?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filtroMaterial) {
      whereClause += ' AND ((codigo LIKE ? OR apelido LIKE ?) OR (codigo_produto LIKE ? OR produto LIKE ?))';
      params.push(`%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`);
    }

    if (filtroLocalizacao) {
      whereClause += ' AND localizacao LIKE ?';
      params.push(`%${filtroLocalizacao}%`);
    }

    if (filtroFamilia) {
      whereClause += ' AND familia LIKE ?';
      params.push(`%${filtroFamilia}%`);
    }

    const [result] = await conn.execute(`
      SELECT
        arquivo,
        codigo,
        produto_nome,
        familia,
        SUM(quantidade) as quantidade_total,
        ROUND(SUM(peso), 2) as peso_total,
        COUNT(*) as registros
      FROM (
        SELECT 'tecido01' as arquivo, codigo_produto as codigo, produto as produto_nome, '' as familia, metros as quantidade, peso, localizacao
        FROM estoque_tecido01
        UNION ALL
        SELECT 'fatex01' as arquivo, codigo, apelido as produto_nome, familia, qtde as quantidade, peso_bruto as peso, localizacao
        FROM estoque_fatex01
        UNION ALL
        SELECT 'confec01' as arquivo, codigo, apelido as produto_nome, familia, qtde as quantidade, peso_bruto as peso, localizacao
        FROM estoque_confec01
        UNION ALL
        SELECT 'estsc01' as arquivo, codigo, apelido as produto_nome, familia, qtde as quantidade, peso_bruto as peso, localizacao
        FROM estoque_estsc01
      ) as estoque_unificado
      ${whereClause}
      GROUP BY arquivo, codigo, produto_nome, familia
      ORDER BY quantidade_total DESC
      LIMIT 50
    `, params);

    return result;
  } finally {
    conn.release();
  }
}

// Função para buscar dados agregados por localização
async function getDadosPorLocalizacao(filtroMaterial?: string, filtroLocalizacao?: string, filtroFamilia?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filtroMaterial) {
      whereClause += ' AND ((codigo LIKE ? OR produto_nome LIKE ?) OR (codigo_produto LIKE ? OR produto LIKE ?))';
      params.push(`%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`);
    }

    if (filtroLocalizacao) {
      whereClause += ' AND localizacao LIKE ?';
      params.push(`%${filtroLocalizacao}%`);
    }

    if (filtroFamilia) {
      whereClause += ' AND familia LIKE ?';
      params.push(`%${filtroFamilia}%`);
    }

    const [result] = await conn.execute(`
      SELECT
        localizacao,
        COUNT(DISTINCT CONCAT(arquivo, '-', codigo)) as produtos_unicos,
        ROUND(SUM(quantidade), 2) as quantidade_total,
        ROUND(SUM(peso), 2) as peso_total,
        COUNT(*) as registros
      FROM (
        SELECT 'tecido01' as arquivo, localizacao, codigo_produto as codigo, metros as quantidade, peso
        FROM estoque_tecido01
        UNION ALL
        SELECT 'fatex01' as arquivo, localizacao, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_fatex01
        UNION ALL
        SELECT 'confec01' as arquivo, localizacao, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_confec01
        UNION ALL
        SELECT 'estsc01' as arquivo, localizacao, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_estsc01
      ) as estoque_unificado
      ${whereClause}
      GROUP BY localizacao
      ORDER BY quantidade_total DESC
      LIMIT 50
    `, params);

    return result;
  } finally {
    conn.release();
  }
}

// Função para buscar dados agregados por família
async function getDadosPorFamilia(filtroMaterial?: string, filtroLocalizacao?: string, filtroFamilia?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filtroMaterial) {
      whereClause += ' AND ((codigo LIKE ? OR produto_nome LIKE ?) OR (codigo_produto LIKE ? OR produto LIKE ?))';
      params.push(`%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`, `%${filtroMaterial}%`);
    }

    if (filtroLocalizacao) {
      whereClause += ' AND localizacao LIKE ?';
      params.push(`%${filtroLocalizacao}%`);
    }

    if (filtroFamilia) {
      whereClause += ' AND familia LIKE ?';
      params.push(`%${filtroFamilia}%`);
    }

    const [result] = await conn.execute(`
      SELECT
        familia,
        COUNT(DISTINCT CONCAT(arquivo, '-', codigo)) as produtos_unicos,
        ROUND(SUM(quantidade), 2) as quantidade_total,
        ROUND(SUM(peso), 2) as peso_total,
        COUNT(*) as registros
      FROM (
        SELECT 'tecido01' as arquivo, '' as familia, codigo_produto as codigo, metros as quantidade, peso
        FROM estoque_tecido01
        UNION ALL
        SELECT 'fatex01' as arquivo, familia, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_fatex01
        UNION ALL
        SELECT 'confec01' as arquivo, familia, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_confec01
        UNION ALL
        SELECT 'estsc01' as arquivo, familia, codigo, qtde as quantidade, peso_bruto as peso
        FROM estoque_estsc01
      ) as estoque_unificado
      ${whereClause}
      GROUP BY familia
      ORDER BY quantidade_total DESC
      LIMIT 50
    `, params);

    return result;
  } finally {
    conn.release();
  }
}

// Função para buscar filtros disponíveis
async function getFiltrosDisponiveis() {
  const conn = await pool.getConnection();
  try {
    // Buscar famílias disponíveis (apenas das tabelas que têm família)
    const [familias] = await conn.execute(`
      SELECT DISTINCT familia
      FROM (
        SELECT familia FROM estoque_fatex01 WHERE familia IS NOT NULL AND familia != ''
        UNION
        SELECT familia FROM estoque_confec01 WHERE familia IS NOT NULL AND familia != ''
        UNION
        SELECT familia FROM estoque_estsc01 WHERE familia IS NOT NULL AND familia != ''
      ) as familias
      ORDER BY familia
    `);

    // Buscar localizações disponíveis
    const [localizacoes] = await conn.execute(`
      SELECT DISTINCT localizacao
      FROM (
        SELECT localizacao FROM estoque_tecido01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_fatex01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_confec01 WHERE localizacao IS NOT NULL AND localizacao != ''
        UNION
        SELECT localizacao FROM estoque_estsc01 WHERE localizacao IS NOT NULL AND localizacao != ''
      ) as localizacoes
      ORDER BY localizacao
    `);

    return {
      familias: familias,
      localizacoes: localizacoes
    };
  } finally {
    conn.release();
  }
}

// NOVAS FUNÇÕES DE ANÁLISE COM TAB_DADOS_

// 1. Análise de Giro de Estoque
async function getAnaliseGiroEstoque(ano?: string, mes?: string, familia?: string) {
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

    // Calcular giro de estoque (Faturamento / Estoque Médio)
    const [giroEstoque] = await conn.execute(`
      WITH estoque_data AS (
        SELECT 
          \`Codigo Familia\`,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as estoque_qtde,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as estoque_valor
        FROM tab_dados_estoque
        ${whereClause}
        GROUP BY \`Codigo Familia\`
      ),
      faturamento_data AS (
        SELECT 
          \`Codigo Familia\`,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as faturamento_qtde,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as faturamento_valor
        FROM tab_dados_faturamento
        ${whereClause}
        GROUP BY \`Codigo Familia\`
      )
      SELECT 
        COALESCE(e.Codigo_Familia, f.Codigo_Familia) as familia,
        COALESCE(e.estoque_valor, 0) as estoque_valor,
        COALESCE(f.faturamento_valor, 0) as faturamento_valor,
        CASE 
          WHEN COALESCE(e.estoque_valor, 0) > 0 
          THEN ROUND(COALESCE(f.faturamento_valor, 0) / e.estoque_valor, 2)
          ELSE 0 
        END as giro_estoque,
        CASE 
          WHEN COALESCE(f.faturamento_valor, 0) > 0 
          THEN ROUND((COALESCE(e.estoque_valor, 0) / f.faturamento_valor) * 365, 0)
          ELSE 0 
        END as dias_estoque
      FROM estoque_data e
      FULL OUTER JOIN faturamento_data f ON e.Codigo_Familia = f.Codigo_Familia
      ORDER BY giro_estoque DESC
      LIMIT 20
    `, params);

    return giroEstoque;
  } finally {
    conn.release();
  }
}

// 2. Análise de Performance vs Business Plan
async function getAnaliseBusinessPlan(ano?: string, mes?: string, familia?: string) {
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

    const [performanceVsPlan] = await conn.execute(`
      WITH business_plan AS (
        SELECT 
          \`Codigo Familia\`,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as plan_qtde,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as plan_valor
        FROM tab_dados_business_plan
        ${whereClause}
        GROUP BY \`Codigo Familia\`
      ),
      faturamento_real AS (
        SELECT 
          \`Codigo Familia\`,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as real_qtde,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as real_valor
        FROM tab_dados_faturamento
        ${whereClause}
        GROUP BY \`Codigo Familia\`
      )
      SELECT 
        COALESCE(bp.Codigo_Familia, fr.Codigo_Familia) as familia,
        COALESCE(bp.plan_valor, 0) as plan_valor,
        COALESCE(fr.real_valor, 0) as real_valor,
        CASE 
          WHEN COALESCE(bp.plan_valor, 0) > 0 
          THEN ROUND((COALESCE(fr.real_valor, 0) / bp.plan_valor) * 100, 2)
          ELSE 0 
        END as percentual_atingido,
        COALESCE(fr.real_valor, 0) - COALESCE(bp.plan_valor, 0) as variacao_valor
      FROM business_plan bp
      FULL OUTER JOIN faturamento_real fr ON bp.Codigo_Familia = fr.Codigo_Familia
      WHERE COALESCE(bp.plan_valor, 0) > 0 OR COALESCE(fr.real_valor, 0) > 0
      ORDER BY percentual_atingido DESC
      LIMIT 20
    `, params);

    return performanceVsPlan;
  } finally {
    conn.release();
  }
}

// 3. Análise de Disponibilidade de Produtos
async function getAnaliseDisponibilidade(familia?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (familia) {
      whereClause += ' AND `Codigo Familia` = ?';
      params.push(familia);
    }

    const [disponibilidade] = await conn.execute(`
      SELECT 
        \`Codigo Familia\` as familia,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as disponivel_mes_atual,
        (SELECT SUM(CAST(QTDE AS DECIMAL(15,2))) 
         FROM tab_dados_disponibilidade_mes_mais_1 dm1 
         WHERE dm1.\`Codigo Familia\` = dm.\`Codigo Familia\`) as disponivel_mes_1,
        (SELECT SUM(CAST(QTDE AS DECIMAL(15,2))) 
         FROM tab_dados_disponibilidade_mes_mais_2 dm2 
         WHERE dm2.\`Codigo Familia\` = dm.\`Codigo Familia\`) as disponivel_mes_2,
        (SELECT SUM(CAST(QTDE AS DECIMAL(15,2))) 
         FROM tab_dados_disponibilidade_mes_mais_3 dm3 
         WHERE dm3.\`Codigo Familia\` = dm.\`Codigo Familia\`) as disponivel_mes_3
      FROM tab_dados_disponibilidade_mes dm
      ${whereClause}
      GROUP BY \`Codigo Familia\`
      ORDER BY disponivel_mes_atual DESC
      LIMIT 20
    `, params);

    return disponibilidade;
  } finally {
    conn.release();
  }
}

// 4. Análise de Ordens de Compra Pendentes
async function getAnaliseOcPendente(familia?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (familia) {
      whereClause += ' AND `Codigo Familia` = ?';
      params.push(familia);
    }

    const [ocPendente] = await conn.execute(`
      SELECT 
        \`Codigo Familia\` as familia,
        COUNT(*) as total_ocs,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as qtde_pendente,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_pendente,
        AVG(CAST(VALOR AS DECIMAL(15,2))) as valor_medio_oc,
        MIN(Data) as data_oc_mais_antiga,
        MAX(Data) as data_oc_mais_recente
      FROM tab_dados_oc_pendente
      ${whereClause}
      GROUP BY \`Codigo Familia\`
      ORDER BY valor_pendente DESC
      LIMIT 20
    `, params);

    return ocPendente;
  } finally {
    conn.release();
  }
}

// 5. Indicadores Financeiros
async function getIndicadoresFinanceiros(ano?: string, mes?: string) {
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

    // Indicadores consolidados
    const [indicadores] = await conn.execute(`
      SELECT 
        'Estoque' as indicador,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor,
        SUM(CAST(\`Valor Custo\` AS DECIMAL(15,2))) as custo
      FROM tab_dados_estoque
      ${whereClause}
      UNION ALL
      SELECT 
        'Faturamento' as indicador,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor,
        SUM(CAST(\`Valor Custo\` AS DECIMAL(15,2))) as custo
      FROM tab_dados_faturamento
      ${whereClause}
      UNION ALL
      SELECT 
        'Business Plan' as indicador,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor,
        SUM(CAST(\`Valor Custo\` AS DECIMAL(15,2))) as custo
      FROM tab_dados_business_plan
      ${whereClause}
      UNION ALL
      SELECT 
        'OC Pendente' as indicador,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor,
        SUM(CAST(\`Valor Custo\` AS DECIMAL(15,2))) as custo
      FROM tab_dados_oc_pendente
      ${whereClause}
      UNION ALL
      SELECT 
        'Recebimento' as indicador,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor,
        SUM(CAST(\`Valor Custo\` AS DECIMAL(15,2))) as custo
      FROM tab_dados_recebimento
      ${whereClause}
    `, params);

    return indicadores;
  } finally {
    conn.release();
  }
}

// 6. Análise de Faturamento com filtros avançados
async function getAnaliseFaturamento(familia?: string, cor?: string, tamanho?: string, empresa?: string, ano?: string, mes?: string) {
  const conn = await pool.getConnection();
  try {
    let whereClause = 'WHERE INDICADOR = "Faturamento"';
    const params: any[] = [];

    if (familia) {
      whereClause += ' AND `Codigo Familia` = ?';
      params.push(familia);
    }
    if (cor) {
      whereClause += ' AND `Codigo Cor` = ?';
      params.push(cor);
    }
    if (tamanho) {
      whereClause += ' AND `Codigo Tam` = ?';
      params.push(tamanho);
    }
    if (empresa) {
      whereClause += ' AND Empresa = ?';
      params.push(empresa);
    }
    if (ano) {
      whereClause += ' AND Ano = ?';
      params.push(ano);
    }
    if (mes) {
      whereClause += ' AND Mes = ?';
      params.push(mes);
    }

    // Análise temporal de faturamento
    const [faturamentoTemporal] = await conn.execute(`
      SELECT
        Ano,
        Mes,
        \`Codigo Familia\` as familia,
        \`Codigo Cor\` as cor,
        \`Codigo Tam\` as tamanho,
        Empresa,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
        AVG(CAST(VALOR AS DECIMAL(15,2))) as valor_medio,
        COUNT(*) as numero_registros
      FROM tab_dados_faturamento
      ${whereClause}
      GROUP BY Ano, Mes, \`Codigo Familia\`, \`Codigo Cor\`, \`Codigo Tam\`, Empresa
      ORDER BY Ano DESC, Mes DESC, valor_total DESC
      LIMIT 100
    `, params);

    // Resumo por período
    const [resumoPeriodo] = await conn.execute(`
      SELECT
        Ano,
        Mes,
        SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total,
        SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
        COUNT(DISTINCT \`Codigo Familia\`) as familias_ativas,
        COUNT(DISTINCT \`Codigo Cor\`) as cores_ativas,
        COUNT(DISTINCT \`Codigo Tam\`) as tamanhos_ativos,
        COUNT(DISTINCT Empresa) as empresas_ativas
      FROM tab_dados_faturamento
      ${whereClause.replace('WHERE INDICADOR = "Faturamento"', 'WHERE INDICADOR = "Faturamento"')}
      GROUP BY Ano, Mes
      ORDER BY Ano DESC, Mes DESC
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

// 7. Filtros disponíveis para os novos campos
async function getFiltrosEstoque() {
  const conn = await pool.getConnection();
  try {
    // Buscar famílias disponíveis nos dados
    const [familias] = await conn.execute(`
      SELECT DISTINCT \`Codigo Familia\` as familia
      FROM tab_dados_faturamento
      WHERE \`Codigo Familia\` IS NOT NULL AND \`Codigo Familia\` != ''
      ORDER BY \`Codigo Familia\`
    `);

    // Buscar cores disponíveis
    const [cores] = await conn.execute(`
      SELECT DISTINCT \`Codigo Cor\` as cor
      FROM tab_dados_faturamento
      WHERE \`Codigo Cor\` IS NOT NULL AND \`Codigo Cor\` != ''
      ORDER BY \`Codigo Cor\`
    `);

    // Buscar tamanhos disponíveis
    const [tamanhos] = await conn.execute(`
      SELECT DISTINCT \`Codigo Tam\` as tamanho
      FROM tab_dados_faturamento
      WHERE \`Codigo Tam\` IS NOT NULL AND \`Codigo Tam\` != ''
      ORDER BY \`Codigo Tam\`
    `);

    // Buscar empresas disponíveis
    const [empresas] = await conn.execute(`
      SELECT DISTINCT Empresa as empresa
      FROM tab_dados_faturamento
      WHERE Empresa IS NOT NULL AND Empresa != ''
      ORDER BY Empresa
    `);

    // Buscar anos disponíveis
    const [anos] = await conn.execute(`
      SELECT DISTINCT Ano as ano
      FROM tab_dados_faturamento
      WHERE Ano IS NOT NULL AND Ano != ''
      ORDER BY Ano DESC
    `);

    // Buscar meses disponíveis
    const [meses] = await conn.execute(`
      SELECT DISTINCT Mes as mes
      FROM tab_dados_faturamento
      WHERE Mes IS NOT NULL AND Mes != ''
      ORDER BY CAST(Mes AS UNSIGNED)
    `);

    return {
      familias,
      cores,
      tamanhos,
      empresas,
      anos,
      meses
    };
  } finally {
    conn.release();
  }
}