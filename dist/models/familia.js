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
    async findActive() {
        const [rows] = await database_1.pool.execute('SELECT * FROM familia WHERE ativo = 1 ORDER BY nome');
        return rows;
    }
}
exports.FamiliaModel = FamiliaModel;
exports.familiaModel = new FamiliaModel();
