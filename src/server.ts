import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import mainRoutes from './routes/main';
import logoutRoutes from './routes/logout';
import cadastrosRoutes from './routes/cadastros';
import { initDatabase } from './models/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize database
(async () => {
  await initDatabase();
})();

// Routes
app.use('/', authRoutes);
app.use('/', mainRoutes);
app.use('/', logoutRoutes);
app.use('/cadastros', cadastrosRoutes);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});