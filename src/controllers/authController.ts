import { Request, Response } from 'express';
import { createUser, findUserByEmail, validatePassword, generateToken } from '../models/user';

export const getLogin = (req: Request, res: Response) => {
  res.render('login', { errors: [], layout: false });
};

export const postLogin = async (req: Request, res: Response) => {
  console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
  
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Missing email or password');
    return res.render('login', { errors: [{ msg: 'Email and password are required' }], layout: false });
  }

  try {
    const user = await findUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found');
      return res.render('login', { errors: [{ msg: 'Invalid credentials' }], layout: false });
    }

    const isValidPassword = await validatePassword(password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password');
      return res.render('login', { errors: [{ msg: 'Invalid credentials' }], layout: false });
    }

    const token = generateToken(user);
    console.log('Token generated, setting cookie and redirecting');
    
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });
    
    console.log('Redirecting to dashboard...');
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { errors: [{ msg: 'An error occurred during login' }], layout: false });
  }
};

export const getRegister = (req: Request, res: Response) => {
  res.render('register', { errors: [], layout: false });
};

export const postRegister = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name || password.length < 6) {
    return res.render('register', { errors: [{ msg: 'All fields are required and password must be at least 6 characters' }], layout: false });
  }

  try {
    await createUser(email, password, name);
    res.redirect('/login');
  } catch (err) {
    res.render('register', { errors: [{ msg: 'Email already exists' }], layout: false });
  }
};

export const getForgotPassword = (req: Request, res: Response) => {
  res.render('forgot-password', { message: '', layout: false });
};

export const postForgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.render('forgot-password', { message: 'Email is required', layout: false });
  }

  // For now, just show a message. In production, send email.
  res.render('forgot-password', { message: 'If the email exists, a reset link has been sent.', layout: false });
};