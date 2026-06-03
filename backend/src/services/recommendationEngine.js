import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import Recommendation from '../models/Recommendation.js';
import Store from '../models/Store.js';

const DAYS_WINDOW = 14;

const getStoreMetrics = async () => {
  const since = new Date();
  since.setDate(since.getDate() - DAYS_WINDOW);

  const stores = await Store.find({ isActive: true }).lean();
  const inventoryByStore = await Inventory.aggregate([
    { $group: { _id: '$store', totalQty: { $sum: '$quantity' }, items: { $sum: 1 } } },
  ]);
  const salesByStore = await Sale.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$store', totalSold: { $sum: '$quantity' }, revenue: { $sum: '$totalAmount' } } },
  ]);

  const invMap = Object.fromEntries(inventoryByStore.map((i) => [i._id.toString(), i]));
  const salesMap = Object.fromEntries(salesByStore.map((s) => [s._id.toString(), s]));

  return stores.map((store) => {
    const id = store._id.toString();
    const inv = invMap[id]?.totalQty || 0;
    const sold = salesMap[id]?.totalSold || 0;
    const velocity = sold / DAYS_WINDOW;
    return { storeId: store._id, name: store.name, inventory: inv, sales: sold, velocity };
  });
};

const getProductStoreMatrix = async () => {
  const since = new Date();
  since.setDate(since.getDate() - DAYS_WINDOW);

  const inventory = await Inventory.find({ quantity: { $gt: 0 } })
    .populate('product', 'name category')
    .populate('store', 'name')
    .lean();

  const sales = await Sale.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { store: '$store', product: '$product' },
        sold: { $sum: '$quantity' },
      },
    },
  ]);

  const salesMap = new Map(
    sales.map((s) => [`${s._id.store}-${s._id.product}`, s.sold])
  );

  return inventory.map((item) => ({
    productId: item.product._id,
    productName: item.product.name,
    storeId: item.store._id,
    storeName: item.store.name,
    quantity: item.quantity,
    expiryDate: item.expiryDate,
    sold: salesMap.get(`${item.store._id}-${item.product._id}`) || 0,
  }));
};

export const generateRecommendations = async () => {
  const metrics = await getStoreMetrics();
  if (metrics.length < 2) return [];

  const avgVelocity =
    metrics.reduce((s, m) => s + m.velocity, 0) / metrics.length || 0.1;
  const avgInventory =
    metrics.reduce((s, m) => s + m.inventory, 0) / metrics.length || 1;

  const fastStores = metrics.filter(
    (m) => m.velocity > avgVelocity * 1.2 && m.inventory < avgInventory * 0.8
  );
  const slowStores = metrics.filter(
    (m) => m.velocity < avgVelocity * 0.8 && m.inventory > avgInventory * 1.2
  );

  const matrix = await getProductStoreMatrix();
  const recommendations = [];

  const idStr = (id) => id?.toString?.() ?? String(id);

  for (const fast of fastStores) {
    for (const slow of slowStores) {
      if (idStr(fast.storeId) === idStr(slow.storeId)) continue;

      const surplusAtSlow = matrix.filter(
        (r) =>
          idStr(r.storeId) === idStr(slow.storeId) &&
          r.quantity > 5 &&
          r.sold < avgVelocity
      );
      const needAtFast = matrix.filter(
        (r) =>
          idStr(r.storeId) === idStr(fast.storeId) &&
          (r.quantity < 10 || r.sold > avgVelocity)
      );

      for (const surplus of surplusAtSlow) {
        const fastNeed = needAtFast.find(
          (n) => idStr(n.productId) === idStr(surplus.productId)
        );
        const fastHasLow =
          !fastNeed || fastNeed.quantity < 15 || fastNeed.sold > surplus.sold * 1.5;

        if (!fastHasLow && surplus.sold >= 3) continue;

        const suggestedQty = Math.min(
          Math.max(5, Math.floor(surplus.quantity * 0.3)),
          surplus.quantity - 2
        );
        if (suggestedQty < 1) continue;

        const hoursToExpiry =
          (new Date(surplus.expiryDate) - new Date()) / (1000 * 60 * 60);
        let priority = 'medium';
        if (hoursToExpiry <= 24) priority = 'high';
        else if (hoursToExpiry <= 48) priority = 'high';

        recommendations.push({
          product: surplus.productId,
          fromStore: slow.storeId,
          toStore: fast.storeId,
          suggestedQuantity: suggestedQty,
          reason: `${slow.name} has excess ${surplus.productName} (low sales). ${fast.name} needs stock (higher demand).`,
          priority,
          expiresAt: surplus.expiryDate,
        });
      }
    }
  }

  await Recommendation.updateMany({ status: 'pending' }, { status: 'dismissed' });

  const unique = [];
  const seen = new Set();
  for (const rec of recommendations) {
    const key = `${rec.product}-${rec.fromStore}-${rec.toStore}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(rec);
  }

  const created = await Recommendation.insertMany(unique.slice(0, 20), {
    ordered: false,
  }).catch(async () => {
    const docs = [];
    for (const rec of unique.slice(0, 20)) {
      const doc = await Recommendation.create(rec);
      docs.push(doc);
    }
    return docs;
  });

  return await Recommendation.find({
    _id: { $in: (Array.isArray(created) ? created : []).map((d) => d._id) },
  })
    .populate('product', 'name category price')
    .populate('fromStore', 'name address')
    .populate('toStore', 'name address')
    .sort({ priority: -1, createdAt: -1 });
};

export const getExpiryBuckets = async () => {
  const now = new Date();
  const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const items = await Inventory.find({ quantity: { $gt: 0 }, expiryDate: { $lte: in48 } })
    .populate('product', 'name category')
    .populate('store', 'name')
    .sort({ expiryDate: 1 })
    .lean();

  return {
    within24h: items.filter((i) => new Date(i.expiryDate) <= in24),
    within48h: items.filter(
      (i) => new Date(i.expiryDate) > in24 && new Date(i.expiryDate) <= in48
    ),
  };
};
