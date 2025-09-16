import { pool } from './database';
import { OrdemCompraItemModel } from './ordemCompraItem';

export interface OrdemCompra {
  id: number;
  familia_id: number;
  tamanho_id: number;
  cor_id: number;
  sku: string;
  quantidade: number;
  unidade_medida: string;
  valor_compra_brl: number;
  cotacao_dolar: number;
  valor_compra_usd: number;
  etd_planejado: string;
  etd_proposto?: string;
  etd_real?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrdemCompraCreateData {
  numero_oc?: string;
  fornecedor?: string;
  data_emissao?: string;
  data_entrega_prevista?: string;
  observacoes?: string;
  status: string;
}

export interface OrdemCompraWithItems extends OrdemCompra {
  itens: any[];
  total_itens: number;
  valor_total_brl: number;
  valor_total_usd: number;
}

export class OrdemCompraModel {
  private readonly tableName = 'ordem_compra';
  private readonly numericFields = [
    'id', 'familia_id', 'tamanho_id', 'cor_id',
    'quantidade', 'valor_compra_brl', 'cotacao_dolar', 'valor_compra_usd'
  ] as const;

  // Helper para conversão de tipos numéricos do MySQL
  private convertNumericFields(row: any): OrdemCompra {
    const converted = { ...row };
    this.numericFields.forEach(field => {
      if (converted[field] !== null && converted[field] !== undefined) {
        converted[field] = Number(converted[field]);
      }
    });
    return converted as OrdemCompra;
  }

  // Helper para conversão de arrays de resultados
  private convertRowsToOrdemCompra(rows: any[]): OrdemCompra[] {
    return rows.map(row => this.convertNumericFields(row));
  }

  // Validação básica de dados
  private validateOrdemCompraData(data: Partial<OrdemCompra>): void {
    if (data.quantidade !== undefined && data.quantidade < 0) {
      throw new Error('Quantidade não pode ser negativa');
    }
    if (data.valor_compra_brl !== undefined && data.valor_compra_brl < 0) {
      throw new Error('Valor em BRL não pode ser negativo');
    }
    if (data.cotacao_dolar !== undefined && data.cotacao_dolar <= 0) {
      throw new Error('Cotação do dólar deve ser maior que zero');
    }
  }

  // Métodos CRUD básicos
  async findAll(): Promise<OrdemCompra[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    return this.convertRowsToOrdemCompra(rows as any[]);
  }

  async findById(id: number): Promise<OrdemCompra | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    const results = rows as any[];
    return results.length > 0 ? this.convertNumericFields(results[0]) : null;
  }

  async create(data: Omit<OrdemCompra, 'id' | 'created_at' | 'updated_at'>): Promise<OrdemCompra> {
    this.validateOrdemCompraData(data);

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const [result] = await pool.execute(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values
    );

    const insertId = (result as any).insertId;
    const created = await this.findById(insertId);

    if (!created) {
      throw new Error('Falha ao criar ordem de compra');
    }

    return created;
  }

  async update(id: number, data: Partial<Omit<OrdemCompra, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    this.validateOrdemCompraData(data);

    const columns = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET ${columns} WHERE id = ?`,
      values
    );

    return (result as any).affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    const [result] = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  // Métodos com joins
  async findAllWithDetails(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT oc.*, f.nome as familia_nome, t.nome as tamanho_nome, c.nome as cor_nome
      FROM ordem_compra oc
      LEFT JOIN familia f ON oc.familia_id = f.id
      LEFT JOIN tamanho t ON oc.tamanho_id = t.id
      LEFT JOIN cor c ON oc.cor_id = c.id
      ORDER BY oc.created_at DESC
    `);
    return this.convertRowsToOrdemCompra(rows as any[]);
  }

  // Métodos para trabalhar com múltiplos itens
  async findAllWithItems(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT
        oc.*,
        COUNT(oci.id) as total_itens,
        COALESCE(SUM(oci.valor_total_brl), 0) as valor_total_brl,
        COALESCE(SUM(oci.valor_total_usd), 0) as valor_total_usd
      FROM ${this.tableName} oc
      LEFT JOIN ordem_compra_itens oci ON oc.id = oci.ordem_compra_id
      GROUP BY oc.id
      ORDER BY oc.created_at DESC
    `);

    return rows as any[];
  }

  async findByIdWithItems(id: number): Promise<OrdemCompraWithItems | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    const oc = await this.findById(id);
    if (!oc) return null;

    const itens = await this.getItensByOrdemCompraId(id);
    const totais = this.calcularTotais(itens);

    return {
      ...oc,
      itens,
      ...totais
    };
  }

  // Helpers para operações com itens
  private async getItensByOrdemCompraId(ordemCompraId: number): Promise<any[]> {
    // Gerar numero_oc baseado no ID
    const numeroOC = `OC${ordemCompraId.toString().padStart(6, '0')}`;
    return await OrdemCompraItemModel.findByNumeroOCWithDetails(numeroOC);
  }

  private calcularTotais(itens: any[]): { total_itens: number; valor_total_brl: number; valor_total_usd: number } {
    const totalItens = itens.length;
    const valorTotalBrl = itens.reduce((sum, item) => sum + Number(item.valor_total_brl || 0), 0);
    const valorTotalUsd = itens.reduce((sum, item) => sum + Number(item.valor_total_usd || 0), 0);

    return {
      total_itens: totalItens,
      valor_total_brl: valorTotalBrl,
      valor_total_usd: valorTotalUsd
    };
  }

  // Método auxiliar para criar OC com dados básicos
  private async createOrdemCompraBasica(data: OrdemCompraCreateData): Promise<number> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const [result] = await pool.execute(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values
    );

    return (result as any).insertId;
  }

  // Método auxiliar para atualizar OC com dados básicos
  private async updateOrdemCompraBasica(id: number, data: OrdemCompraCreateData): Promise<void> {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
      values
    );
  }

  // Método auxiliar para gerenciar itens
  private async replaceItens(ordemCompraId: number, itensData: any[]): Promise<void> {
    if (!itensData || itensData.length === 0) return;

    const numeroOC = `OC${ordemCompraId.toString().padStart(6, '0')}`;

    // Remover itens existentes
    await OrdemCompraItemModel.deleteByNumeroOC(numeroOC);

    // Criar novos itens
    for (const itemData of itensData) {
      await OrdemCompraItemModel.create({
        numero_oc: numeroOC,
        familia_id: itemData.familia_id,
        tamanho_id: itemData.tamanho_id,
        cor_id: itemData.cor_id,
        quantidade: itemData.quantidade,
        preco_unitario: itemData.preco_unitario
      });
    }
  }

  async createWithItems(ordemCompraData: OrdemCompraCreateData, itensData: any[]): Promise<OrdemCompraWithItems> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Criar a ordem de compra
      const ordemCompraId = await this.createOrdemCompraBasica(ordemCompraData);

      // Criar os itens
      if (itensData && itensData.length > 0) {
        await this.replaceItens(ordemCompraId, itensData);
      }

      await connection.commit();

      // Retornar a OC completa com itens
      const result = await this.findByIdWithItems(ordemCompraId);
      if (!result) {
        throw new Error('Falha ao recuperar ordem de compra criada');
      }

      return result;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateWithItems(id: number, ordemCompraData: OrdemCompraCreateData, itensData: any[]): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Atualizar dados da OC
      await this.updateOrdemCompraBasica(id, ordemCompraData);

      // Gerenciar itens
      await this.replaceItens(id, itensData);

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const ordemCompraModel = new OrdemCompraModel();
