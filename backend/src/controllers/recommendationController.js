import Recommendation from '../models/Recommendation.js';
import Inventory from '../models/Inventory.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateRecommendations } from '../services/recommendationEngine.js';
import { emitDashboardUpdate } from '../services/socketService.js';

export const getRecommendations = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const filter = {};
  if (status !== 'all') filter.status = status;

  let data = await Recommendation.find(filter)
    .populate('product', 'name category price')
    .populate('fromStore', 'name address')
    .populate('toStore', 'name address')
    .sort({ priority: -1, createdAt: -1 })
    .limit(50);

  if (data.length === 0 && status === 'pending') {
    data = await generateRecommendations();
  }

  res.json({ success: true, data });
});

export const refreshRecommendations = asyncHandler(async (req, res) => {
  const data = await generateRecommendations();
  emitDashboardUpdate('recommendations:refreshed');
  res.json({ success: true, data });
});

export const updateRecommendationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'dismissed', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const rec = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )
    .populate('product', 'name category price')
    .populate('fromStore', 'name address')
    .populate('toStore', 'name address');

  if (!rec) throw new ApiError(404, 'Recommendation not found');

  if (status === 'accepted') {
    const fromInv = await Inventory.findOne({
      product: rec.product._id,
      store: rec.fromStore._id,
      quantity: { $gte: rec.suggestedQuantity },
    }).sort({ expiryDate: 1 });

    if (fromInv) {
      const expiryDate = fromInv.expiryDate;
      fromInv.quantity -= rec.suggestedQuantity;
      if (fromInv.quantity <= 0) await fromInv.deleteOne();
      else await fromInv.save();

      const toInv = await Inventory.findOne({
        product: rec.product._id,
        store: rec.toStore._id,
      });
      if (toInv) {
        toInv.quantity += rec.suggestedQuantity;
        await toInv.save();
      } else if (expiryDate) {
        await Inventory.create({
          product: rec.product._id,
          store: rec.toStore._id,
          quantity: rec.suggestedQuantity,
          expiryDate,
        });
      }
      emitDashboardUpdate('transfer:completed');
    }
  }

  res.json({ success: true, data: rec });
});
