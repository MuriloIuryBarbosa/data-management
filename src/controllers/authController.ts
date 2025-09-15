import { Request, Response } from 'express';
import { createUser, findUserByEmail, validatePassword, generateToken } from '../models/user';

export const getLogin = (req: Request, res: Response) => {
  res.render('login', { errors: [], layout: false });
};

export const postLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { errors: [{ msg: 'Email and password are required' }], layout: false });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await validatePassword(password, user.password))) {
    return res.render('login', { errors: [{ msg: 'Invalid credentials' }], layout: false });
  }

  const token = generateToken(user);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
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