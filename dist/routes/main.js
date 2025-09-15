"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mainController_1 = require("../controllers/mainController");
const router = express_1.default.Router();
router.get('/', mainController_1.authenticateToken, mainController_1.getDashboard);
exports.default = router;
