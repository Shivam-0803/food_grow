import { Router } from 'express';
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getStores);
router.get('/:id', getStore);
router.post('/', authorize('admin'), createStore);
router.put('/:id', authorize('admin'), updateStore);
router.delete('/:id', authorize('admin'), deleteStore);

export default router;
