import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

export const initDatabase = () => {
  db.serialize(() => {
    db.run(`
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
    db.run(`
      ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding role column:', err.message);
      }
    });

    // Create Familia table
    db.run(`
      CREATE TABLE IF NOT EXISTS familia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_old TEXT,
        nome_old TEXT,
        legado TEXT,
        nome TEXT NOT NULL,
        descricao TEXT,
        ativo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tamanho table
    db.run(`
      CREATE TABLE IF NOT EXISTS tamanho (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_old TEXT,
        nome_old TEXT,
        legado TEXT,
        nome TEXT NOT NULL,
        sigla TEXT,
        ordem INTEGER,
        ativo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Cor table
    db.run(`
      CREATE TABLE IF NOT EXISTS cor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_old TEXT,
        nome_old TEXT,
        legado TEXT,
        nome TEXT NOT NULL,
        codigo_hex TEXT,
        ativo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
};