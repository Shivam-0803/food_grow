import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitDashboardUpdate } from '../services/socketService.js';
import { generateRecommendations, getExpiryBuckets } from '../services/recommendationEngine.js';

const populateOpts = [
  { path: 'product', select: 'name category price shelfLife' },
  { path: 'store', select: 'name address' },
];

export const getInventory = asyncHandler(async (req, res) => {
  const { store, product, search } = req.query;
  const filter = { quantity: { $gte: 0 } };
  if (store) filter.store = store;
  if (product) filter.product = product;
  if (req.user.role === 'store_manager' && req.user.store) {
    filter.store = req.user.store._id;
  }

  let items = await Inventory.find(filter).populate(populateOpts).sort({ expiryDate: 1 });

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.product?.name?.toLowerCase().includes(q) ||
        i.store?.name?.toLowerCase().includes(q)
    );
  }

  const now = new Date();
  const enriched = items.map((item) => {
    const hours = (new Date(item.expiryDate) - now) / (1000 * 60 * 60);
    let expiryStatus = 'ok';
    if (hours <= 24) expiryStatus = 'critical';
    else if (hours <= 48) expiryStatus = 'warning';
    return { ...item.toObject(), expiryStatus };
  });

  res.json({ success: true, data: enriched });
});

export const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate(populateOpts);
  if (!item) throw new ApiError(404, 'Inventory not found');
  res.json({ success: true, data: item });
});

export const createInventory = asyncHandler(async (req, res) => {
  const { product, store, quantity, expiryDate } = req.body;
  if (!product || !store || quantity == null || !expiryDate) {
    throw new ApiError(400, 'Product, store, quantity and expiry date required');
  }

  if (req.user.role === 'store_manager' && req.user.store) {
    if (store.toString() !== req.user.store._id.toString()) {
      throw new ApiError(403, 'Can only manage your assigned store');
    }
  }

  const productDoc = await Product.findById(product);
  if (!productDoc) throw new ApiError(404, 'Product not found');

  const item = await Inventory.create({ product, store, quantity, expiryDate });
  await generateRecommendations();
  emitDashboardUpdate('inventory:created');
  const populated = await Inventory.findById(item._id).populate(populateOpts);
  res.status(201).json({ success: true, data: populated });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Inventory not found');

  if (req.user.role === 'store_manager' && req.user.store) {
    if (item.store.toString() !== req.user.store._id.toString()) {
      throw new ApiError(403, 'Can only manage your assigned store');
    }
  }

  Object.assign(item, req.body);
  await item.save();
  await generateRecommendations();
  emitDashboardUpdate('inventory:updated');
  const populated = await Inventory.findById(item._id).populate(populateOpts);
  res.json({ success: true, data: populated });
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Inventory not found');
  await generateRecommendations();
  emitDashboardUpdate('inventory:deleted');
  res.json({ success: true, message: 'Inventory removed' });
});

export const getExpiryAlerts = asyncHandler(async (req, res) => {
  const buckets = await getExpiryBuckets();
  res.json({ success: true, data: buckets });
});
