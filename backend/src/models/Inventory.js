import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

inventorySchema.index({ store: 1, product: 1 });
inventorySchema.index({ expiryDate: 1 });

export default mongoose.model('Inventory', inventorySchema);
