import { Router } from 'express';

const router = Router();

// Health check for decision service
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Decision service is running' });
});

export default router;