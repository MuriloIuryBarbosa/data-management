import express from 'express';
import { authenticateToken, getDashboard } from '../controllers/mainController';

const router = express.Router();

router.get('/', authenticateToken, getDashboard);

export default router;