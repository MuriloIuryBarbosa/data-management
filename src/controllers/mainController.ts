import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../models/user';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('Authentication check for path:', req.path);
  console.log('Cookies received:', req.cookies);
  
  const token = req.cookies.token;
  
  if (!token) {
    console.log('No token found, redirecting to login');
    return res.redirect('/login');
  }

  console.log('Token found, verifying...');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    console.log('Token verification failed, redirecting to login');
    return res.redirect('/login');
  }

  console.log('Token verified successfully for user:', decoded.email);
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