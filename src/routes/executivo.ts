import express from 'express';
import { authenticateToken } from '../controllers/mainController';
import { getAnaliseEstoque } from '../controllers/executivoController';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas de executivo
router.use(authenticateToken);

// Rota para Análise de Estoque
router.get('/analise-estoque', getAnaliseEstoque);

export default router;