"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mainController_1 = require("../controllers/mainController");
const cadastrosController_1 = require("../controllers/cadastrosController");
const familiaController_1 = require("../controllers/familiaController");
const tamanhoController_1 = require("../controllers/tamanhoController");
const corController_1 = require("../controllers/corController");
const router = express_1.default.Router();
// Aplicar middleware de autenticação a todas as rotas de cadastros
router.use(mainController_1.authenticateToken);
// Rota principal do módulo cadastros
router.get('/', cadastrosController_1.getCadastros);
// Rotas para Famílias
router.get('/familias', familiaController_1.getFamilias);
router.get('/familias/novo', familiaController_1.getNovaFamilia);
router.post('/familias', familiaController_1.postFamilia);
router.get('/familias/:id/editar', familiaController_1.getEditarFamilia);
router.post('/familias/:id', familiaController_1.putFamilia);
router.post('/familias/:id/delete', familiaController_1.deleteFamilia);
// Rotas para Tamanhos
router.get('/tamanhos', tamanhoController_1.getTamanhos);
router.get('/tamanhos/novo', tamanhoController_1.getNovoTamanho);
router.post('/tamanhos', tamanhoController_1.postTamanho);
router.get('/tamanhos/:id/editar', tamanhoController_1.getEditarTamanho);
router.post('/tamanhos/:id', tamanhoController_1.putTamanho);
router.post('/tamanhos/:id/delete', tamanhoController_1.deleteTamanho);
// Rotas para Cores
router.get('/cores', corController_1.getCores);
router.get('/cores/novo', corController_1.getNovaCor);
router.post('/cores', corController_1.postCor);
router.get('/cores/:id/editar', corController_1.getEditarCor);
router.post('/cores/:id', corController_1.putCor);
router.post('/cores/:id/delete', corController_1.deleteCor);
exports.default = router;
