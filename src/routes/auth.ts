import express from 'express';
import { getLogin, postLogin, getRegister, postRegister, getForgotPassword, postForgotPassword } from '../controllers/authController';

const router = express.Router();

router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/register', getRegister);
router.post('/register', postRegister);
router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', postForgotPassword);

// Rota de debug para verificar cookies
router.get('/debug-auth', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    hasToken: !!req.cookies.token,
    userAgent: req.get('User-Agent')
  });
});

export default router;