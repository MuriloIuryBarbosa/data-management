import { pool } from './database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface OrdemCompraHistorico {
  id?: number;
  ordem_compra_id: number;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  usuario_id: number | null;
  usuario_nome: string | null;
  data_alteracao?: Date;
  tipo_alteracao: 'criacao' | 'edicao' | 'exclusao';
}

export interface OrdemCompraHistoricoCreateData {
  ordem_compra_id: number;
  campo_alterado: string;
  valor_anterior?: any;
  valor_novo?: any;
  usuario_id?: number;
  usuario_nome?: string;
  tipo_alteracao: 'criacao' | 'edicao' | 'exclusao';
}

export interface OrdemCompraHistoricoWithDetails extends OrdemCompraHistorico {
  ordem_compra_numero?: string;
}

export class OrdemCompraHistoricoModel {
  private static readonly TABLE_NAME = 'ordem_compra_historico';

  /**
   * Campos que podem ser rastreados no histórico
   */
  private static readonly TRACKABLE_FIELDS = [
    'familia_id', 'tamanho_id', 'cor_id', 'sku', 'quantidade',
    'unidade_medida', 'valor_compra_brl', 'cotacao_dolar', 'valor_compra_usd',
    'etd_planejado', 'etd_proposto', 'etd_real', 'status'
  ];

  /**
   * Valida os dados antes da criação
   */
  private static validateHistoricoData(data: OrdemCompraHistoricoCreateData): void {
    if (!data.ordem_compra_id || data.ordem_compra_id <= 0) {
      throw new Error('ID da ordem de compra é obrigatório e deve ser maior que 0');
    }
    if (!data.campo_alterado?.trim()) {
      throw new Error('Campo alterado é obrigatório');
    }
    if (!['criacao', 'edicao', 'exclusao'].includes(data.tipo_alteracao)) {
      throw new Error('Tipo de alteração deve ser: criacao, edicao ou exclusao');
    }
  }

  /**
   * Converte valores para string de forma segura
   */
  private static convertValueToString(value: any): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Converte dados de criação para o formato interno
   */
  private static convertCreateData(data: OrdemCompraHistoricoCreateData): Omit<OrdemCompraHistorico, 'id' | 'data_alteracao'> {
    return {
      ordem_compra_id: data.ordem_compra_id,
      campo_alterado: data.campo_alterado,
      valor_anterior: this.convertValueToString(data.valor_anterior),
      valor_novo: this.convertValueToString(data.valor_novo),
      usuario_id: data.usuario_id || null,
      usuario_nome: data.usuario_nome || null,
      tipo_alteracao: data.tipo_alteracao
    };
  }

  /**
   * Cria um novo registro de histórico
   */
  static async create(data: OrdemCompraHistoricoCreateData): Promise<OrdemCompraHistorico> {
    this.validateHistoricoData(data);
    const convertedData = this.convertCreateData(data);

    const connection = await pool.getConnection();

    try {
      const columns = Object.keys(convertedData).join(', ');
      const placeholders = Object.keys(convertedData).map(() => '?').join(', ');
      const values = Object.values(convertedData);

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ${this.TABLE_NAME} (${columns}, data_alteracao) VALUES (${placeholders}, NOW())`,
        values
      );

      return {
        id: result.insertId,
        ...convertedData,
        data_alteracao: new Date()
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Busca um registro por ID
   */
  static async findById(id: number): Promise<OrdemCompraHistorico | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] as OrdemCompraHistorico : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Busca todos os registros de histórico de uma ordem de compra
   */
  static async findByOrdemCompraId(ordemCompraId: number): Promise<OrdemCompraHistorico[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE ordem_compra_id = ? ORDER BY data_alteracao DESC`,
        [ordemCompraId]
      );

      return rows as OrdemCompraHistorico[];
    } finally {
      connection.release();
    }
  }

  /**
   * Busca registros com detalhes da ordem de compra
   */
  static async findByOrdemCompraIdWithDetails(ordemCompraId: number): Promise<OrdemCompraHistoricoWithDetails[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT
          h.*,
          CONCAT('OC', LPAD(oc.id, 6, '0')) as ordem_compra_numero
         FROM ${this.TABLE_NAME} h
         LEFT JOIN ordem_compra oc ON h.ordem_compra_id = oc.id
         WHERE h.ordem_compra_id = ?
         ORDER BY h.data_alteracao DESC`,
        [ordemCompraId]
      );

      return rows as OrdemCompraHistoricoWithDetails[];
    } finally {
      connection.release();
    }
  }

  /**
   * Busca todos os registros de histórico
   */
  static async findAll(): Promise<OrdemCompraHistorico[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} ORDER BY data_alteracao DESC`
      );

      return rows as OrdemCompraHistorico[];
    } finally {
      connection.release();
    }
  }

  /**
   * Busca registros por tipo de alteração
   */
  static async findByTipoAlteracao(tipoAlteracao: 'criacao' | 'edicao' | 'exclusao'): Promise<OrdemCompraHistorico[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE tipo_alteracao = ? ORDER BY data_alteracao DESC`,
        [tipoAlteracao]
      );

      return rows as OrdemCompraHistorico[];
    } finally {
      connection.release();
    }
  }

  /**
   * Busca registros por usuário
   */
  static async findByUsuarioId(usuarioId: number): Promise<OrdemCompraHistorico[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE usuario_id = ? ORDER BY data_alteracao DESC`,
        [usuarioId]
      );

      return rows as OrdemCompraHistorico[];
    } finally {
      connection.release();
    }
  }

  /**
   * Registra uma alteração específica
   */
  static async registrarAlteracao(
    ordemCompraId: number,
    campoAlterado: string,
    valorAnterior: any,
    valorNovo: any,
    usuarioId?: number,
    usuarioNome?: string,
    tipoAlteracao: 'criacao' | 'edicao' | 'exclusao' = 'edicao'
  ): Promise<void> {
    const data: OrdemCompraHistoricoCreateData = {
      ordem_compra_id: ordemCompraId,
      campo_alterado: campoAlterado,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      tipo_alteracao: tipoAlteracao
    };

    await this.create(data);
  }

  /**
   * Compara objetos e registra todas as diferenças encontradas
   */
  static async registrarAlteracoes(
    ordemCompraId: number,
    dadosAnteriores: Record<string, any>,
    dadosNovos: Record<string, any>,
    usuarioId?: number,
    usuarioNome?: string
  ): Promise<void> {
    const alteracoes: OrdemCompraHistoricoCreateData[] = [];

    for (const campo of this.TRACKABLE_FIELDS) {
      if (dadosAnteriores[campo] !== dadosNovos[campo]) {
        alteracoes.push({
          ordem_compra_id: ordemCompraId,
          campo_alterado: campo,
          valor_anterior: dadosAnteriores[campo],
          valor_novo: dadosNovos[campo],
          usuario_id: usuarioId,
          usuario_nome: usuarioNome,
          tipo_alteracao: 'edicao'
        });
      }
    }

    // Criar todas as alterações em lote para melhor performance
    if (alteracoes.length > 0) {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        for (const alteracao of alteracoes) {
          await this.create(alteracao);
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  }

  /**
   * Registra criação de uma nova ordem de compra
   */
  static async registrarCriacao(
    ordemCompraId: number,
    dadosIniciais: Record<string, any>,
    usuarioId?: number,
    usuarioNome?: string
  ): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const campo of this.TRACKABLE_FIELDS) {
        if (dadosIniciais[campo] !== undefined) {
          await this.registrarAlteracao(
            ordemCompraId,
            campo,
            null,
            dadosIniciais[campo],
            usuarioId,
            usuarioNome,
            'criacao'
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Registra exclusão de uma ordem de compra
   */
  static async registrarExclusao(
    ordemCompraId: number,
    dadosFinais: Record<string, any>,
    usuarioId?: number,
    usuarioNome?: string
  ): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const campo of this.TRACKABLE_FIELDS) {
        if (dadosFinais[campo] !== undefined) {
          await this.registrarAlteracao(
            ordemCompraId,
            campo,
            dadosFinais[campo],
            null,
            usuarioId,
            usuarioNome,
            'exclusao'
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Remove um registro de histórico
   */
  static async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Remove todos os registros de histórico de uma ordem de compra
   */
  static async deleteByOrdemCompraId(ordemCompraId: number): Promise<number> {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM ${this.TABLE_NAME} WHERE ordem_compra_id = ?`,
        [ordemCompraId]
      );

      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtém estatísticas de alterações por período
   */
  static async getEstatisticasAlteracoes(
    dataInicio: Date,
    dataFim: Date
  ): Promise<{
    totalAlteracoes: number;
    alteracoesPorTipo: Record<string, number>;
    alteracoesPorUsuario: Record<string, number>;
    camposMaisAlterados: Record<string, number>;
  }> {
    const connection = await pool.getConnection();

    try {
      // Total de alterações
      const [totalRows] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM ${this.TABLE_NAME} WHERE data_alteracao BETWEEN ? AND ?`,
        [dataInicio, dataFim]
      );

      // Alterações por tipo
      const [tipoRows] = await connection.execute<RowDataPacket[]>(
        `SELECT tipo_alteracao, COUNT(*) as quantidade FROM ${this.TABLE_NAME}
         WHERE data_alteracao BETWEEN ? AND ?
         GROUP BY tipo_alteracao`,
        [dataInicio, dataFim]
      );

      // Alterações por usuário
      const [usuarioRows] = await connection.execute<RowDataPacket[]>(
        `SELECT usuario_nome, COUNT(*) as quantidade FROM ${this.TABLE_NAME}
         WHERE data_alteracao BETWEEN ? AND ? AND usuario_nome IS NOT NULL
         GROUP BY usuario_nome`,
        [dataInicio, dataFim]
      );

      // Campos mais alterados
      const [campoRows] = await connection.execute<RowDataPacket[]>(
        `SELECT campo_alterado, COUNT(*) as quantidade FROM ${this.TABLE_NAME}
         WHERE data_alteracao BETWEEN ? AND ?
         GROUP BY campo_alterado ORDER BY quantidade DESC`,
        [dataInicio, dataFim]
      );

      const alteracoesPorTipo: Record<string, number> = {};
      tipoRows.forEach(row => {
        alteracoesPorTipo[row.tipo_alteracao] = row.quantidade;
      });

      const alteracoesPorUsuario: Record<string, number> = {};
      usuarioRows.forEach(row => {
        alteracoesPorUsuario[row.usuario_nome] = row.quantidade;
      });

      const camposMaisAlterados: Record<string, number> = {};
      campoRows.forEach(row => {
        camposMaisAlterados[row.campo_alterado] = row.quantidade;
      });

      return {
        totalAlteracoes: totalRows[0].total,
        alteracoesPorTipo,
        alteracoesPorUsuario,
        camposMaisAlterados
      };
    } finally {
      connection.release();
    }
  }
}