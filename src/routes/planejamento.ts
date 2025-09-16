import express from 'express';
import { authenticateToken } from '../controllers/mainController';
import { getOrdemCompra, getNovoOrdemCompra, createOrdemCompra, getVerOrdemCompra, getEditarOrdemCompra, updateOrdemCompra, getHistoricoOrdemCompra, approveOrdemCompra, getPurchaseOrder, getVerPurchaseOrder, updatePurchaseOrderStatus } from '../controllers/planejamentoController';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas de planejamento
router.use(authenticateToken);

// Rota para Ordem de Compra
router.get('/ordem-compra', getOrdemCompra);
router.get('/ordem-compra/novo', getNovoOrdemCompra);
router.post('/ordem-compra', createOrdemCompra);
router.get('/ordem-compra/:id', getVerOrdemCompra);
router.get('/ordem-compra/:id/editar', getEditarOrdemCompra);
router.post('/ordem-compra/:id', updateOrdemCompra);
router.post('/ordem-compra/:id/approve', approveOrdemCompra);
router.get('/ordem-compra/:id/historico', getHistoricoOrdemCompra);

// Rota para Purchase Order
router.get('/purchase-order', getPurchaseOrder);
router.get('/purchase-order/:id', getVerPurchaseOrder);
router.post('/purchase-order/:id/status', updatePurchaseOrderStatus);

export default router;