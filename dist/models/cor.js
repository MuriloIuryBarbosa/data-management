"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corModel = exports.CorModel = void 0;
const entities_1 = require("./entities");
const database_1 = require("./database");
class CorModel extends entities_1.BaseModel {
    constructor() {
        super('cor');
    }
    async findByNome(nome) {
        const [rows] = await database_1.pool.execute('SELECT * FROM cor WHERE nome = ? AND ativo = 1', [nome]);
        const results = rows;
        return results.length > 0 ? results[0] : null;
    }
    async findActive() {
        const [rows] = await database_1.pool.execute('SELECT * FROM cor WHERE ativo = 1 ORDER BY nome');
        return rows;
    }
    async count() {
        const [rows] = await database_1.pool.execute('SELECT COUNT(*) as total FROM cor WHERE ativo = 1');
        const result = rows;
        return result[0].total;
    }
}
exports.CorModel = CorModel;
exports.corModel = new CorModel();
