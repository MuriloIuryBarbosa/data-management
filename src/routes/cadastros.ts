import express from 'express';
import { authenticateToken } from '../controllers/mainController';
import { getCadastros } from '../controllers/cadastrosController';
import {
  getFamilias,
  getNovaFamilia,
  postFamilia,
  getEditarFamilia,
  putFamilia,
  deleteFamilia
} from '../controllers/familiaController';
import {
  getTamanhos,
  getNovoTamanho,
  postTamanho,
  getEditarTamanho,
  putTamanho,
  deleteTamanho
} from '../controllers/tamanhoController';
import {
  getCores,
  getNovaCor,
  postCor,
  getEditarCor,
  putCor,
  deleteCor
} from '../controllers/corController';

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas de cadastros
router.use(authenticateToken);

// Rota principal do módulo cadastros
router.get('/', getCadastros);

// Rotas para Famílias
router.get('/familias', getFamilias);
router.get('/familias/novo', getNovaFamilia);
router.post('/familias', postFamilia);
router.get('/familias/:id/editar', getEditarFamilia);
router.post('/familias/:id', putFamilia);
router.post('/familias/:id/delete', deleteFamilia);

// Rotas para Tamanhos
router.get('/tamanhos', getTamanhos);
router.get('/tamanhos/novo', getNovoTamanho);
router.post('/tamanhos', postTamanho);
router.get('/tamanhos/:id/editar', getEditarTamanho);
router.post('/tamanhos/:id', putTamanho);
router.post('/tamanhos/:id/delete', deleteTamanho);

// Rotas para Cores
router.get('/cores', getCores);
router.get('/cores/novo', getNovaCor);
router.post('/cores', postCor);
router.get('/cores/:id/editar', getEditarCor);
router.post('/cores/:id', putCor);
router.post('/cores/:id/delete', deleteCor);

export default router;