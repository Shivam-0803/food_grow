import { Router } from 'express';
import authRoutes from './authRoutes.js';
import storeRoutes from './storeRoutes.js';
import productRoutes from './productRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import saleRoutes from './saleRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'FoodFlow API is running' });
});

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', saleRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
