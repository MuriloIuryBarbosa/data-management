import express from 'express';
import { authenticateToken, getDashboard } from '../controllers/mainController';
import path from 'path';

const router = express.Router();

router.get('/', authenticateToken, getDashboard);

// Rota de teste simples
router.get('/teste-minimo', (req, res) => {
    res.sendFile(path.join(__dirname, '../../teste-minimo.html'));
});

// Rota de teste de login
router.get('/login-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../../login-test.html'));
});

export default router;