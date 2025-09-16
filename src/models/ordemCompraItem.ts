import { pool } from './database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface OrdemCompraItem {
  id?: number;
  numero_oc: string;
  sku: string;
  quantidade: number;
  valor_unitario_brl: number;
  valor_total_brl: number;
  familia_id: number;
  tamanho_id: number;
  cor_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrdemCompraItemCreateData {
  numero_oc: string;
  familia_id: number;
  tamanho_id: number;
  cor_id: number;
  quantidade: number;
  valor_unitario_brl: number;
}

export interface OrdemCompraItemWithDetails extends OrdemCompraItem {
  familia_nome?: string;
  tamanho_nome?: string;
  cor_nome?: string;
}

export class OrdemCompraItemModel {
  private static readonly TABLE_NAME = 'ordem_compra_itens';

  /**
   * Valida os dados de um item antes da criação/atualização
   */
  private static validateItemData(data: Partial<OrdemCompraItemCreateData>): void {
    if (!data.numero_oc?.trim()) {
      throw new Error('Número da OC é obrigatório');
    }
    if (!data.familia_id || data.familia_id <= 0) {
      throw new Error('ID da família é obrigatório e deve ser maior que 0');
    }
    if (!data.tamanho_id || data.tamanho_id <= 0) {
      throw new Error('ID do tamanho é obrigatório e deve ser maior que 0');
    }
    if (!data.cor_id || data.cor_id <= 0) {
      throw new Error('ID da cor é obrigatório e deve ser maior que 0');
    }
    if (!data.quantidade || data.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que 0');
    }
    if (!data.valor_unitario_brl || data.valor_unitario_brl <= 0) {
      throw new Error('Preço unitário deve ser maior que 0');
    }
  }

  /**
   * Gera SKU baseado nos IDs de família, tamanho e cor
   */
  private static async generateSKU(familiaId: number, tamanhoId: number, corId: number): Promise<string> {
    const connection = await pool.getConnection();

    try {
      // Buscar nomes das tabelas relacionadas
      const [familiaRows] = await connection.execute<RowDataPacket[]>(
        'SELECT nome FROM familia WHERE id = ?',
        [familiaId]
      );

      const [tamanhoRows] = await connection.execute<RowDataPacket[]>(
        'SELECT nome, sigla FROM tamanho WHERE id = ?',
        [tamanhoId]
      );

      const [corRows] = await connection.execute<RowDataPacket[]>(
        'SELECT nome FROM cor WHERE id = ?',
        [corId]
      );

      if (familiaRows.length === 0 || tamanhoRows.length === 0 || corRows.length === 0) {
        throw new Error('Família, tamanho ou cor não encontrados');
      }

      const familia = familiaRows[0].nome.replace(/\s+/g, '').toUpperCase();
      const tamanho = (tamanhoRows[0].sigla || tamanhoRows[0].nome).replace(/\s+/g, '').toUpperCase();
      const cor = corRows[0].nome.replace(/\s+/g, '').toUpperCase();

      return `${familia}${tamanho}${cor}`;
    } finally {
      connection.release();
    }
  }

  /**
   * Calcula o preço total baseado na quantidade e preço unitário
   */
  private static calculateTotalPrice(quantidade: number, precoUnitario: number): number {
    return quantidade * precoUnitario;
  }

  /**
   * Converte campos numéricos para garantir tipos corretos
   */
  private static convertNumericFields(data: any): OrdemCompraItemCreateData {
    return {
      numero_oc: data.numero_oc,
      familia_id: parseInt(data.familia_id),
      tamanho_id: parseInt(data.tamanho_id),
      cor_id: parseInt(data.cor_id),
      quantidade: parseFloat(data.quantidade),
      valor_unitario_brl: parseFloat(data.valor_unitario_brl)
    };
  }

  /**
   * Cria um novo item de ordem de compra
   */
  static async create(data: OrdemCompraItemCreateData): Promise<OrdemCompraItem> {
    this.validateItemData(data);

    const convertedData = this.convertNumericFields(data);
    const sku = await this.generateSKU(convertedData.familia_id, convertedData.tamanho_id, convertedData.cor_id);
    const precoTotal = this.calculateTotalPrice(convertedData.quantidade, convertedData.valor_unitario_brl);

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ${this.TABLE_NAME}
         (numero_oc, sku, quantidade, valor_unitario_brl, valor_total_brl, familia_id, tamanho_id, cor_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          convertedData.numero_oc,
          sku,
          convertedData.quantidade,
          convertedData.valor_unitario_brl,
          precoTotal,
          convertedData.familia_id,
          convertedData.tamanho_id,
          convertedData.cor_id
        ]
      );

      return {
        id: result.insertId,
        numero_oc: convertedData.numero_oc,
        sku,
        quantidade: convertedData.quantidade,
        valor_unitario_brl: convertedData.valor_unitario_brl,
        valor_total_brl: precoTotal,
        familia_id: convertedData.familia_id,
        tamanho_id: convertedData.tamanho_id,
        cor_id: convertedData.cor_id,
        created_at: new Date(),
        updated_at: new Date()
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Busca um item por ID
   */
  static async findById(id: number): Promise<OrdemCompraItem | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] as OrdemCompraItem : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Busca todos os itens de uma ordem de compra
   */
  static async findByNumeroOC(numeroOC: string): Promise<OrdemCompraItem[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE numero_oc = ? ORDER BY id`,
        [numeroOC]
      );

      return rows as OrdemCompraItem[];
    } finally {
      connection.release();
    }
  }

  /**
   * Busca itens com detalhes (família, tamanho, cor)
   */
  static async findByNumeroOCWithDetails(numeroOC: string): Promise<OrdemCompraItemWithDetails[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT
          i.*,
          f.nome as familia_nome,
          t.nome as tamanho_nome,
          c.nome as cor_nome
         FROM ${this.TABLE_NAME} i
         LEFT JOIN familia f ON i.familia_id = f.id
         LEFT JOIN tamanho t ON i.tamanho_id = t.id
         LEFT JOIN cor c ON i.cor_id = c.id
         WHERE i.numero_oc = ?
         ORDER BY i.id`,
        [numeroOC]
      );

      return rows as OrdemCompraItemWithDetails[];
    } finally {
      connection.release();
    }
  }

  /**
   * Atualiza um item
   */
  static async update(id: number, data: Partial<OrdemCompraItemCreateData>): Promise<boolean> {
    const convertedData = this.convertNumericFields(data);

    if (Object.keys(convertedData).length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    // Se estamos atualizando família, tamanho ou cor, precisamos regerar o SKU
    let sku: string | undefined;
    if (convertedData.familia_id || convertedData.tamanho_id || convertedData.cor_id) {
      const item = await this.findById(id);
      if (!item) {
        throw new Error('Item não encontrado');
      }

      const familiaId = convertedData.familia_id || item.familia_id;
      const tamanhoId = convertedData.tamanho_id || item.tamanho_id;
      const corId = convertedData.cor_id || item.cor_id;

      sku = await this.generateSKU(familiaId, tamanhoId, corId);
    }

    // Recalcular preço total se quantidade ou preço unitário foram alterados
    let precoTotal: number | undefined;
    if (convertedData.quantidade || convertedData.valor_unitario_brl) {
      const item = await this.findById(id);
      if (!item) {
        throw new Error('Item não encontrado');
      }

      const quantidade = convertedData.quantidade || item.quantidade;
      const precoUnitario = convertedData.valor_unitario_brl || item.valor_unitario_brl;
      precoTotal = this.calculateTotalPrice(quantidade, precoUnitario);
    }

    const connection = await pool.getConnection();

    try {
      let query = `UPDATE ${this.TABLE_NAME} SET updated_at = NOW()`;
      const params: any[] = [];

      if (sku !== undefined) {
        query += ', sku = ?';
        params.push(sku);
      }

      if (convertedData.quantidade !== undefined) {
        query += ', quantidade = ?';
        params.push(convertedData.quantidade);
      }

      if (convertedData.valor_unitario_brl !== undefined) {
        query += ', valor_unitario_brl = ?';
        params.push(convertedData.valor_unitario_brl);
      }

      if (precoTotal !== undefined) {
        query += ', valor_total_brl = ?';
        params.push(precoTotal);
      }

      if (convertedData.familia_id !== undefined) {
        query += ', familia_id = ?';
        params.push(convertedData.familia_id);
      }

      if (convertedData.tamanho_id !== undefined) {
        query += ', tamanho_id = ?';
        params.push(convertedData.tamanho_id);
      }

      if (convertedData.cor_id !== undefined) {
        query += ', cor_id = ?';
        params.push(convertedData.cor_id);
      }

      query += ' WHERE id = ?';
      params.push(id);

      const [result] = await connection.execute<ResultSetHeader>(query, params);

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Remove um item
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
   * Remove todos os itens de uma ordem de compra
   */
  static async deleteByNumeroOC(numeroOC: string): Promise<number> {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM ${this.TABLE_NAME} WHERE numero_oc = ?`,
        [numeroOC]
      );

      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  /**
   * Calcula totais de uma ordem de compra
   */
  static async calculateTotals(numeroOC: string): Promise<{ totalItens: number; totalValor: number }> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total_itens,
          SUM(preco_total) as total_valor
         FROM ${this.TABLE_NAME}
         WHERE numero_oc = ?`,
        [numeroOC]
      );

      const result = rows[0];
      return {
        totalItens: result.total_itens || 0,
        totalValor: result.total_valor || 0
      };
    } finally {
      connection.release();
    }
  }
}