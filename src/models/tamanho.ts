import { BaseModel, Tamanho } from './entities';
import { pool } from './database';

export class TamanhoModel extends BaseModel<Tamanho> {
  constructor() {
    super('tamanho');
  }

  async findByNome(nome: string): Promise<Tamanho | null> {
    const [rows] = await pool.execute('SELECT * FROM tamanho WHERE nome = ? AND ativo = 1', [nome]);
    const results = rows as Tamanho[];
    return results.length > 0 ? results[0] : null;
  }

  async findActive(): Promise<Tamanho[]> {
    const [rows] = await pool.execute('SELECT * FROM tamanho WHERE ativo = 1 ORDER BY ordem, nome');
    return rows as Tamanho[];
  }

  async count(): Promise<number> {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM tamanho WHERE ativo = 1');
    const result = rows as { total: number }[];
    return result[0].total;
  }
}

export const tamanhoModel = new TamanhoModel();