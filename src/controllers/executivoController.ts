import { Request, Response } from 'express';
import { pool } from '../models/database';

// Executivo Controllers
export const getAnaliseEstoque = async (req: Request, res: Response) => {
  try {
    // Filtros da query string
    const filtroMaterial = req.query.material as string;
    const filtroLocalizacao = req.query.localizacao as string;
    const filtroFamilia = req.query.familia as string;

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

    res.render('executivo/analise-estoque/index', {
      estatisticas,
      dadosPorMaterial,
      dadosPorLocalizacao,
      dadosPorFamilia,
      filtrosDisponiveis,
      filtrosAtivos: {
        material: filtroMaterial,
        localizacao: filtroLocalizacao,
        familia: filtroFamilia
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
};

// Função para buscar estatísticas gerais
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