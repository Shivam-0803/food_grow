import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import Recommendation from '../models/Recommendation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getExpiryBuckets } from '../services/recommendationEngine.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const storeFilter =
    req.user.role === 'store_manager' && req.user.store
      ? { store: req.user.store._id }
      : {};

  const [totalStores, totalProducts, inventoryAgg, nearExpiry, recommendations, expiryBuckets] =
    await Promise.all([
      req.user.role === 'admin'
        ? Store.countDocuments({ isActive: true })
        : 1,
      Product.countDocuments({ isActive: true }),
      Inventory.aggregate([
        { $match: { quantity: { $gt: 0 }, ...storeFilter } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]),
      Inventory.countDocuments({
        quantity: { $gt: 0 },
        expiryDate: { $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        ...storeFilter,
      }),
      Recommendation.countDocuments({ status: 'pending' }),
      getExpiryBuckets(),
    ]);

  const totalInventory = inventoryAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      totalStores,
      totalProducts,
      totalInventory,
      nearExpiry,
      transferRecommendations: recommendations,
      expiryAlerts: expiryBuckets,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const storeFilter =
    req.user.role === 'store_manager' && req.user.store
      ? { store: req.user.store._id }
      : {};

  const salesTrends = await Sale.aggregate([
    { $match: { createdAt: { $gte: since }, ...storeFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        units: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const inventoryDistribution = await Inventory.aggregate([
    { $match: { quantity: { $gt: 0 }, ...storeFilter } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: '$productDoc' },
    {
      $group: {
        _id: '$productDoc.category',
        quantity: { $sum: '$quantity' },
      },
    },
    { $sort: { quantity: -1 } },
  ]);

  const storePerformance = await Sale.aggregate([
    { $match: { createdAt: { $gte: since }, ...storeFilter } },
    {
      $lookup: {
        from: 'stores',
        localField: 'store',
        foreignField: '_id',
        as: 'storeDoc',
      },
    },
    { $unwind: '$storeDoc' },
    {
      $group: {
        _id: '$storeDoc.name',
        revenue: { $sum: '$totalAmount' },
        units: { $sum: '$quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: {
      salesTrends: salesTrends.map((d) => ({
        date: d._id,
        revenue: d.revenue,
        units: d.units,
      })),
      inventoryDistribution: inventoryDistribution.map((d) => ({
        category: d._id,
        quantity: d.quantity,
      })),
      storePerformance: storePerformance.map((d) => ({
        store: d._id,
        revenue: d.revenue,
        units: d.units,
      })),
    },
  });
});
