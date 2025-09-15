import { BaseModel, Cor } from './entities';
import { pool } from './database';

export class CorModel extends BaseModel<Cor> {
  constructor() {
    super('cor');
  }

  async findByNome(nome: string): Promise<Cor | null> {
    const [rows] = await pool.execute('SELECT * FROM cor WHERE nome = ? AND ativo = 1', [nome]);
    const results = rows as Cor[];
    return results.length > 0 ? results[0] : null;
  }

  async findActive(): Promise<Cor[]> {
    const [rows] = await pool.execute('SELECT * FROM cor WHERE ativo = 1 ORDER BY nome');
    return rows as Cor[];
  }

  async count(): Promise<number> {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM cor WHERE ativo = 1');
    const result = rows as { total: number }[];
    return result[0].total;
  }
}

export const corModel = new CorModel();