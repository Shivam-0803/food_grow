import { Router } from 'express';
import {
  getRecommendations,
  refreshRecommendations,
  updateRecommendationStatus,
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getRecommendations);
router.post('/refresh', refreshRecommendations);
router.patch('/:id', updateRecommendationStatus);

export default router;
