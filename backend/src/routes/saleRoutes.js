import { Router } from 'express';
import { getSales, createSale } from '../controllers/saleController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getSales);
router.post('/', createSale);

export default router;
