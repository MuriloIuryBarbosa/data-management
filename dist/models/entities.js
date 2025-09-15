"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const database_1 = require("./database");
// Generic CRUD operations
class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }
    async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY id DESC`);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        const results = rows;
        return results.length > 0 ? results[0] : null;
    }
    async create(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const sql = `INSERT INTO ${this.tableName} (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`;
        const [result] = await database_1.pool.execute(sql, values);
        const insertId = result.insertId;
        // Buscar o registro criado
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [insertId]);
        const results = rows;
        return results[0];
    }
    async update(id, data) {
        const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        const sql = `UPDATE ${this.tableName} SET ${updates}, updated_at = NOW() WHERE id = ?`;
        const [result] = await database_1.pool.execute(sql, values);
        return result.affectedRows > 0;
    }
    async delete(id) {
        const [result] = await database_1.pool.execute(`UPDATE ${this.tableName} SET ativo = 0, updated_at = NOW() WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    async hardDelete(id) {
        const [result] = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.BaseModel = BaseModel;
