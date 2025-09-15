"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../database.sqlite');
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
    else {
        console.log('Connected to SQLite database.');
    }
});
const initDatabase = () => {
    exports.db.serialize(() => {
        exports.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add role column if it doesn't exist (for existing databases)
        exports.db.run(`
      ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'
    `, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding role column:', err.message);
            }
        });
    });
};
exports.initDatabase = initDatabase;
