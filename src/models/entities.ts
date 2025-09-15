import { db } from './database';

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
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${this.tableName} ORDER BY id DESC`, (err, rows: T[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async findById(id: number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row: T) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const tableName = this.tableName;

      const sql = `INSERT INTO ${tableName} (${columns}, created_at, updated_at) VALUES (${placeholders}, datetime('now'), datetime('now'))`;

      db.run(sql, [...values], function(err) {
        if (err) {
          reject(err);
        } else {
          const newId = this.lastID;
          // Buscar o registro criado
          db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [newId], (err, row: T) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  }

  async update(id: number, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];

      const sql = `UPDATE ${this.tableName} SET ${updates}, updated_at = datetime('now') WHERE id = ?`;

      db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE ${this.tableName} SET ativo = 0, updated_at = datetime('now') WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async hardDelete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }
}