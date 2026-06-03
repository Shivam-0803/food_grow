import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitDashboardUpdate } from '../services/socketService.js';
import { generateRecommendations } from '../services/recommendationEngine.js';

export const getSales = asyncHandler(async (req, res) => {
  const { store, product, from, to } = req.query;
  const filter = {};
  if (store) filter.store = store;
  if (product) filter.product = product;
  if (req.user.role === 'store_manager' && req.user.store) {
    filter.store = req.user.store._id;
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const sales = await Sale.find(filter)
    .populate('product', 'name category price')
    .populate('store', 'name')
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ success: true, data: sales });
});

export const createSale = asyncHandler(async (req, res) => {
  const { product, store, quantity, inventoryId } = req.body;
  if (!product || !store || !quantity || quantity < 1) {
    throw new ApiError(400, 'Product, store and valid quantity required');
  }

  if (req.user.role === 'store_manager' && req.user.store) {
    if (store.toString() !== req.user.store._id.toString()) {
      throw new ApiError(403, 'Can only record sales for your store');
    }
  }

  const productDoc = await Product.findById(product);
  if (!productDoc) throw new ApiError(404, 'Product not found');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let inventory;
    if (inventoryId) {
      inventory = await Inventory.findById(inventoryId).session(session);
    } else {
      inventory = await Inventory.findOne({
        product,
        store,
        quantity: { $gte: quantity },
        expiryDate: { $gte: new Date() },
      })
        .sort({ expiryDate: 1 })
        .session(session);
    }

    if (!inventory || inventory.quantity < quantity) {
      throw new ApiError(400, 'Insufficient inventory for this sale');
    }

    inventory.quantity -= quantity;
    if (inventory.quantity === 0) {
      await inventory.deleteOne({ session });
    } else {
      await inventory.save({ session });
    }

    const unitPrice = productDoc.price;
    const totalAmount = unitPrice * quantity;

    const [sale] = await Sale.create(
      [
        {
          product,
          store,
          quantity,
          unitPrice,
          totalAmount,
          recordedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await generateRecommendations();
    emitDashboardUpdate('sale:created');

    const populated = await Sale.findById(sale._id)
      .populate('product', 'name category price')
      .populate('store', 'name')
      .populate('recordedBy', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
