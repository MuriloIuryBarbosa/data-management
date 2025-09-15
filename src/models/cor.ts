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

  async findByHex(codigoHex: string): Promise<Cor | null> {
    const [rows] = await pool.execute('SELECT * FROM cor WHERE codigo_hex = ? AND ativo = 1', [codigoHex]);
    const results = rows as Cor[];
    return results.length > 0 ? results[0] : null;
  }
}

export const corModel = new CorModel();