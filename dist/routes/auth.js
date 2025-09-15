"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.get('/login', authController_1.getLogin);
router.post('/login', authController_1.postLogin);
router.get('/register', authController_1.getRegister);
router.post('/register', authController_1.postRegister);
router.get('/forgot-password', authController_1.getForgotPassword);
router.post('/forgot-password', authController_1.postForgotPassword);
exports.default = router;
