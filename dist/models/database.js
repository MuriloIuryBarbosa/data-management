"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'data_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
// Create connection pool
exports.pool = promise_1.default.createPool(dbConfig);
// Test connection
exports.pool.getConnection()
    .then(connection => {
    console.log('Connected to MySQL database.');
    connection.release();
})
    .catch(err => {
    console.error('Error connecting to MySQL database:', err.message);
});
const initDatabase = async () => {
    try {
        // Create database if it doesn't exist
        const connection = await promise_1.default.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``, []);
        await connection.end();
        // Create tables
        const conn = await exports.pool.getConnection();
        // Users table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Familia table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS familia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_old VARCHAR(50),
        nome_old VARCHAR(255),
        legado TEXT,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        ativo TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Tamanho table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS tamanho (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_old VARCHAR(50),
        nome_old VARCHAR(255),
        legado TEXT,
        nome VARCHAR(255) NOT NULL,
        sigla VARCHAR(10),
        ordem INT,
        ativo TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Cor table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS cor (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_old VARCHAR(50),
        nome_old VARCHAR(255),
        legado TEXT,
        nome VARCHAR(255) NOT NULL,
        codigo_hex VARCHAR(7),
        ativo TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Estoque tables
        // confec01 table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS estoque_confec01 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        localizacao VARCHAR(20),
        codigo VARCHAR(20),
        apelido VARCHAR(100),
        familia VARCHAR(100),
        qual VARCHAR(10),
        qmm VARCHAR(10),
        cor VARCHAR(10),
        qtde DECIMAL(10,2),
        desc_cor VARCHAR(50),
        tam VARCHAR(10),
        tamd VARCHAR(10),
        embalagem_vol VARCHAR(50),
        un VARCHAR(20),
        peso_liq DECIMAL(10,3),
        peso_bruto DECIMAL(10,3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // estsc01 table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS estoque_estsc01 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        localizacao VARCHAR(20),
        codigo VARCHAR(20),
        apelido VARCHAR(100),
        familia VARCHAR(100),
        qual VARCHAR(10),
        qmm VARCHAR(10),
        cor VARCHAR(10),
        qtde DECIMAL(10,2),
        desc_cor VARCHAR(50),
        tam VARCHAR(10),
        tamd VARCHAR(10),
        embalagem_vol VARCHAR(50),
        un VARCHAR(20),
        peso_liq DECIMAL(10,3),
        peso_bruto DECIMAL(10,3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // fatex01 table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS estoque_fatex01 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        localizacao VARCHAR(20),
        codigo VARCHAR(20),
        apelido VARCHAR(100),
        familia VARCHAR(100),
        qual VARCHAR(10),
        qmm VARCHAR(10),
        cor VARCHAR(10),
        qtde DECIMAL(10,2),
        desc_cor VARCHAR(50),
        tam VARCHAR(10),
        tamd VARCHAR(10),
        embalagem_vol VARCHAR(50),
        un VARCHAR(20),
        peso_liq DECIMAL(10,3),
        peso_bruto DECIMAL(10,3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // tecido01 table
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS estoque_tecido01 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        localizacao VARCHAR(20),
        tipo VARCHAR(20),
        produto VARCHAR(100),
        entrada DATE,
        qual VARCHAR(10),
        metros DECIMAL(10,2),
        lancamento DATE,
        oper VARCHAR(10),
        peso DECIMAL(10,3),
        un VARCHAR(20),
        nota VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        conn.release();
        console.log('Database tables initialized successfully.');
    }
    catch (error) {
        console.error('Error initializing database:', error);
    }
};
exports.initDatabase = initDatabase;
