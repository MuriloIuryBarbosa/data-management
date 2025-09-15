"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.familiaModel = exports.FamiliaModel = void 0;
const entities_1 = require("./entities");
const database_1 = require("./database");
class FamiliaModel extends entities_1.BaseModel {
    constructor() {
        super('familia');
    }
    async findByNome(nome) {
        const [rows] = await database_1.pool.execute('SELECT * FROM familia WHERE nome = ? AND ativo = 1', [nome]);
        const results = rows;
        return results.length > 0 ? results[0] : null;
    }
    async count() {
        const [rows] = await database_1.pool.execute('SELECT COUNT(*) as total FROM familia WHERE ativo = 1');
        const result = rows;
        return result[0].total;
    }
}
exports.FamiliaModel = FamiliaModel;
exports.familiaModel = new FamiliaModel();
