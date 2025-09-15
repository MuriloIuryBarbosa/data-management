import express from 'express';
import { authenticateToken } from '../controllers/mainController';
import { getOrdemCompra } from '../controllers/planejamentoController';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas de planejamento
router.use(authenticateToken);

// Rota para Ordem de Compra
router.get('/ordem-compra', getOrdemCompra);

export default router;