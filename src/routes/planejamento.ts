import express from 'express';
import { authenticateToken } from '../controllers/mainController';
import { getOrdemCompra, getNovoOrdemCompra, createOrdemCompra } from '../controllers/planejamentoController';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas de planejamento
router.use(authenticateToken);

// Rota para Ordem de Compra
router.get('/ordem-compra', getOrdemCompra);
router.get('/ordem-compra/novo', getNovoOrdemCompra);
router.post('/ordem-compra', createOrdemCompra);

export default router;