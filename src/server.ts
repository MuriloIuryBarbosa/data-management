import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import expressLayouts from 'express-ejs-layouts';
import authRoutes from './routes/auth';
import mainRoutes from './routes/main';
import logoutRoutes from './routes/logout';
import cadastrosRoutes from './routes/cadastros';
import planejamentoRoutes from './routes/planejamento';
import executivoRoutes from './routes/executivo';
import { initDatabase } from './models/database';

const app = express();
const PORT = process.env.PORT || 3000;

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', false); // Disable auto layout application
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
(async () => {
  await initDatabase();
})();

// Routes
app.use('/', authRoutes);
app.use('/', mainRoutes);
app.use('/', logoutRoutes);
app.use('/cadastros', cadastrosRoutes);
app.use('/planejamento', planejamentoRoutes);
app.use('/executivo', executivoRoutes);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});