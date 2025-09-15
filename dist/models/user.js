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
    return new Promise((resolve, reject) => {
        database_1.db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [email, hashedPassword, name, userRole], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    id: this.lastID,
                    email,
                    password: hashedPassword,
                    name,
                    role: userRole,
                    created_at: new Date().toISOString()
                });
            }
        });
    });
};
exports.createUser = createUser;
const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        database_1.db.get('SELECT id, email, password, name, role, created_at FROM users WHERE email = ?', [email], (err, row) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(row || null);
            }
        });
    });
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
const updateUserRole = (userId, role) => {
    return new Promise((resolve, reject) => {
        database_1.db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.changes > 0);
            }
        });
    });
};
exports.updateUserRole = updateUserRole;
const isSuperAdmin = (user) => {
    return user.role === 'super_admin';
};
exports.isSuperAdmin = isSuperAdmin;
