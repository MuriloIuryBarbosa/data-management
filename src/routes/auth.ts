import express from 'express';
import { getLogin, postLogin, getRegister, postRegister, getForgotPassword, postForgotPassword } from '../controllers/authController';

const router = express.Router();

router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/register', getRegister);
router.post('/register', postRegister);
router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', postForgotPassword);

export default router;