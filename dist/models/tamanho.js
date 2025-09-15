"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamanhoModel = exports.TamanhoModel = void 0;
const entities_1 = require("./entities");
const database_1 = require("./database");
class TamanhoModel extends entities_1.BaseModel {
    constructor() {
        super('tamanho');
    }
    async findByNome(nome) {
        const [rows] = await database_1.pool.execute('SELECT * FROM tamanho WHERE nome = ? AND ativo = 1', [nome]);
        const results = rows;
        return results.length > 0 ? results[0] : null;
    }
    async findActive() {
        const [rows] = await database_1.pool.execute('SELECT * FROM tamanho WHERE ativo = 1 ORDER BY ordem, nome');
        return rows;
    }
    async findBySigla(sigla) {
        const [rows] = await database_1.pool.execute('SELECT * FROM tamanho WHERE sigla = ? AND ativo = 1', [sigla]);
        const results = rows;
        return results.length > 0 ? results[0] : null;
    }
}
exports.TamanhoModel = TamanhoModel;
exports.tamanhoModel = new TamanhoModel();
