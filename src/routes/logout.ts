import express from 'express';
import { authenticateToken } from '../controllers/mainController';

const router = express.Router();

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

export default router;