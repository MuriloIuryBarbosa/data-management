"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mainController_1 = require("../controllers/mainController");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.get('/', mainController_1.authenticateToken, mainController_1.getDashboard);
// Rota de teste simples
router.get('/teste-minimo', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../teste-minimo.html'));
});
// Rota de teste de login
router.get('/login-test', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../login-test.html'));
});
exports.default = router;
