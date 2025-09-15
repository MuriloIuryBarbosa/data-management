import { db } from './database';
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
}

export const createUser = async (email: string, password: string, name: string, role?: string): Promise<User | null> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role || (email === 'murilo.iury@corttex.com.br' ? 'super_admin' : 'user');

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, userRole],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            email,
            password: hashedPassword,
            name,
            role: userRole,
            created_at: new Date().toISOString()
          });
        }
      }
    );
  });
};

export const findUserByEmail = (email: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, password, name, role, created_at FROM users WHERE email = ?', [email], (err, row: User) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
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

export const updateUserRole = (userId: number, role: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

export const isSuperAdmin = (user: User): boolean => {
  return user.role === 'super_admin';
};

export const deleteUserByEmail = (email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE email = ?', [email], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};