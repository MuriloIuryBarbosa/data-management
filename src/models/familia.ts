import { BaseModel, Familia } from './entities';
import { pool } from './database';

export class FamiliaModel extends BaseModel<Familia> {
  constructor() {
    super('familia');
  }

  async findByNome(nome: string): Promise<Familia | null> {
    const [rows] = await pool.execute('SELECT * FROM familia WHERE nome = ? AND ativo = 1', [nome]);
    const results = rows as Familia[];
    return results.length > 0 ? results[0] : null;
  }

  async findActive(): Promise<Familia[]> {
    const [rows] = await pool.execute('SELECT * FROM familia WHERE ativo = 1 ORDER BY nome');
    return rows as Familia[];
  }
}

export const familiaModel = new FamiliaModel();