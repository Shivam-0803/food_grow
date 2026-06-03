import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitDashboardUpdate } from '../services/socketService.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const filter = { isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  const products = await Product.find(filter).sort({ name: 1 });
  res.json({ success: true, data: products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, shelfLife } = req.body;
  if (!name || !category || price == null || !shelfLife) {
    throw new ApiError(400, 'All product fields are required');
  }
  const product = await Product.create({ name, category, price, shelfLife });
  emitDashboardUpdate('product:created');
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  emitDashboardUpdate('product:updated');
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  emitDashboardUpdate('product:deleted');
  res.json({ success: true, message: 'Product deactivated' });
});
