import { Router } from 'express';
import {
  getInventory,
  getInventoryItem,
  createInventory,
  updateInventory,
  deleteInventory,
  getExpiryAlerts,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/expiry-alerts', getExpiryAlerts);
router.get('/', getInventory);
router.get('/:id', getInventoryItem);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
