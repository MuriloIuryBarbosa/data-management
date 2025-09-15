"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const main_1 = __importDefault(require("./routes/main"));
const logout_1 = __importDefault(require("./routes/logout"));
const database_1 = require("./models/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// Initialize database
(0, database_1.initDatabase)();
// Routes
app.use('/', auth_1.default);
app.use('/', main_1.default);
app.use('/', logout_1.default);
// Static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
