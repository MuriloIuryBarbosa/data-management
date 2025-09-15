import { pool } from './database';

export interface BaseEntity {
  id: number;
  codigo_old?: string;
  nome_old?: string;
  legado?: string;
  ativo: number;
  created_at: string;
  updated_at: string;
}

export interface Familia extends BaseEntity {
  nome: string;
  descricao?: string;
}

export interface Tamanho extends BaseEntity {
  nome: string;
  sigla?: string;
  ordem?: number;
}

export interface Cor extends BaseEntity {
  nome: string;
  codigo_hex?: string;
}

// Generic CRUD operations
export class BaseModel<T extends BaseEntity> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findAll(): Promise<T[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY id DESC`);
    return rows as T[];
  }

  async findById(id: number): Promise<T | null> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    const results = rows as T[];
    return results.length > 0 ? results[0] : null;
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`;

    const [result] = await pool.execute(sql, values);
    const insertId = (result as any).insertId;

    // Buscar o registro criado
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [insertId]);
    const results = rows as T[];
    return results[0];
  }

  async update(id: number, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<boolean> {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${updates}, updated_at = NOW() WHERE id = ?`;

    const [result] = await pool.execute(sql, values);
    return (result as any).affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute(`UPDATE ${this.tableName} SET ativo = 0, updated_at = NOW() WHERE id = ?`, [id]);
    return (result as any).affectedRows > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const [result] = await pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return (result as any).affectedRows > 0;
  }
}