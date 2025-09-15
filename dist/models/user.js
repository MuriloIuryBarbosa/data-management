"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = exports.updateUserRole = exports.verifyToken = exports.generateToken = exports.validatePassword = exports.findUserByEmail = exports.createUser = void 0;
const database_1 = require("./database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const createUser = async (email, password, name, role) => {
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const userRole = role || (email === 'murilo.iury@corttex.com.br' ? 'super_admin' : 'user');
    try {
        const [result] = await database_1.pool.execute('INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', [email, hashedPassword, name, userRole]);
        const insertId = result.insertId;
        // Buscar o usuário criado
        const [rows] = await database_1.pool.execute('SELECT * FROM users WHERE id = ?', [insertId]);
        const users = rows;
        return users[0];
    }
    catch (error) {
        console.error('Error creating user:', error);
        return null;
    }
};
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const users = rows;
        return users.length > 0 ? users[0] : null;
    }
    catch (error) {
        console.error('Error finding user by email:', error);
        return null;
    }
};
exports.findUserByEmail = findUserByEmail;
const validatePassword = async (password, hashedPassword) => {
    return bcrypt_1.default.compare(password, hashedPassword);
};
exports.validatePassword = validatePassword;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
};
exports.verifyToken = verifyToken;
const updateUserRole = async (userId, role) => {
    try {
        const [result] = await database_1.pool.execute('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [role, userId]);
        return result.affectedRows > 0;
    }
    catch (error) {
        console.error('Error updating user role:', error);
        return false;
    }
};
exports.updateUserRole = updateUserRole;
const isSuperAdmin = (user) => {
    return user.role === 'super_admin';
};
exports.isSuperAdmin = isSuperAdmin;
