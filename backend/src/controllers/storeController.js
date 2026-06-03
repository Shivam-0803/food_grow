import Store from '../models/Store.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitDashboardUpdate } from '../services/socketService.js';

export const getStores = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
    ];
  }
  const stores = await Store.find(filter).sort({ name: 1 });
  res.json({ success: true, data: stores });
});

export const getStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');
  res.json({ success: true, data: store });
});

export const createStore = asyncHandler(async (req, res) => {
  const { name, address, contactNumber } = req.body;
  if (!name || !address || !contactNumber) {
    throw new ApiError(400, 'Name, address and contact number required');
  }
  const store = await Store.create({ name, address, contactNumber });
  emitDashboardUpdate('store:created');
  res.status(201).json({ success: true, data: store });
});

export const updateStore = asyncHandler(async (req, res) => {
  const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!store) throw new ApiError(404, 'Store not found');
  emitDashboardUpdate('store:updated');
  res.json({ success: true, data: store });
});

export const deleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!store) throw new ApiError(404, 'Store not found');
  emitDashboardUpdate('store:deleted');
  res.json({ success: true, message: 'Store deactivated' });
});
