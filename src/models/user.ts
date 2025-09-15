import { pool } from './database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export const createUser = async (email: string, password: string, name: string, role?: string): Promise<User | null> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role || (email === 'murilo.iury@corttex.com.br' ? 'super_admin' : 'user');

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [email, hashedPassword, name, userRole]
    );

    const insertId = (result as any).insertId;

    // Buscar o usuário criado
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [insertId]);
    const users = rows as User[];
    return users[0];
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

export const validatePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: User): string => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const updateUserRole = async (userId: number, role: string): Promise<boolean> => {
  try {
    const [result] = await pool.execute('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [role, userId]);
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

export const isSuperAdmin = (user: User): boolean => {
  return user.role === 'super_admin';
};