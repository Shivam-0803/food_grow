import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    fromStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    toStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    suggestedQuantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'accepted', 'dismissed'], default: 'pending' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

recommendationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Recommendation', recommendationSchema);
