import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../models/user';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.redirect('/login');
  }

  (req as any).user = decoded;
  next();
};

export const getDashboard = (req: Request, res: Response) => {
  res.render('dashboard', {
    user: (req as any).user,
    title: 'Dashboard',
    currentPage: 'dashboard',
    layout: 'layouts/base'
  });
};