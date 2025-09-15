"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const auth_1 = __importDefault(require("./routes/auth"));
const main_1 = __importDefault(require("./routes/main"));
const logout_1 = __importDefault(require("./routes/logout"));
const cadastros_1 = __importDefault(require("./routes/cadastros"));
const database_1 = require("./models/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
app.use(express_ejs_layouts_1.default);
app.set('layout', false); // Disable auto layout application
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
// Middleware para definir variáveis globais para o layout
app.use((req, res, next) => {
    // Definir variáveis padrão para o layout
    res.locals = res.locals || {};
    res.locals.user = req.user || null;
    res.locals.title = res.locals.title || 'Sistema de Gestão de Dados';
    res.locals.currentPage = res.locals.currentPage || '';
    next();
});
// Initialize database
(async () => {
    await (0, database_1.initDatabase)();
})();
// Routes
app.use('/', auth_1.default);
app.use('/', main_1.default);
app.use('/', logout_1.default);
app.use('/cadastros', cadastros_1.default);
// Static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
