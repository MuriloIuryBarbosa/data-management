import { Request, Response } from 'express';
import { pool } from '../models/database';

// Executivo Controllers
export const getAnaliseEstoque = async (req: Request, res: Response) => {
  try {
    console.log('📊 Carregando análise de estoque...');

    const conn = await pool.getConnection();

    try {
      // Buscar soma das colunas VALOR e QTDE
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

      const dados = (result as any)[0];

      console.log('✅ Dados carregados com sucesso');

      res.render('executivo/analise-estoque/index', {
        somaValor: dados.soma_valor || 0,
        somaQtde: dados.soma_qtde || 0,
        totalRegistros: dados.total_registros || 0,
        title: 'Análise de Estoque',
        currentPage: 'analise-estoque',
        layout: 'layouts/base',
        user: (req as any).user
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('❌ Erro ao carregar análise de estoque:', error);
    res.status(500).json({ error: 'Erro ao carregar análise de estoque' });
  }
};