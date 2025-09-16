import { BaseModel } from './entities';
import { pool } from './database';

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
  ativo: number; // Added to satisfy BaseEntity
  created_at: string;
  updated_at: string;
}

export class OrdemCompraModel extends BaseModel<OrdemCompra> {
  constructor() {
    super('ordem_compra');
  }

  async findAllWithDetails(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT oc.*, f.nome as familia_nome, t.nome as tamanho_nome, c.nome as cor_nome
      FROM ordem_compra oc
      LEFT JOIN familia f ON oc.familia_id = f.id
      LEFT JOIN tamanho t ON oc.tamanho_id = t.id
      LEFT JOIN cor c ON oc.cor_id = c.id
      ORDER BY oc.created_at DESC
    `);
    return rows as any[];
  }
}

export const ordemCompraModel = new OrdemCompraModel();
