import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import { generateRecommendations } from '../services/recommendationEngine.js';

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Store.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Sale.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@foodflow.com',
    password: 'admin123',
    role: 'admin',
  });

  const stores = await Store.insertMany([
    { name: 'Downtown Market', address: '100 Main St', contactNumber: '555-0101' },
    { name: 'Westside Grocery', address: '42 Oak Ave', contactNumber: '555-0102' },
    { name: 'Harbor Fresh', address: '8 Pier Rd', contactNumber: '555-0103' },
  ]);

  const products = await Product.insertMany([
    { name: 'Organic Milk 1L', category: 'Dairy', price: 4.99, shelfLife: 7 },
    { name: 'Sourdough Bread', category: 'Bakery', price: 5.49, shelfLife: 3 },
    { name: 'Greek Yogurt', category: 'Dairy', price: 3.29, shelfLife: 14 },
    { name: 'Fresh Salmon Fillet', category: 'Seafood', price: 12.99, shelfLife: 2 },
    { name: 'Mixed Berries', category: 'Produce', price: 6.99, shelfLife: 5 },
  ]);

  const day = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  await Inventory.insertMany([
    { product: products[0]._id, store: stores[0]._id, quantity: 12, expiryDate: day(1) },
    { product: products[0]._id, store: stores[1]._id, quantity: 80, expiryDate: day(5) },
    { product: products[1]._id, store: stores[1]._id, quantity: 45, expiryDate: day(2) },
    { product: products[1]._id, store: stores[0]._id, quantity: 5, expiryDate: day(1) },
    { product: products[2]._id, store: stores[2]._id, quantity: 60, expiryDate: day(10) },
    { product: products[3]._id, store: stores[2]._id, quantity: 25, expiryDate: day(1) },
    { product: products[4]._id, store: stores[0]._id, quantity: 8, expiryDate: day(2) },
    { product: products[4]._id, store: stores[1]._id, quantity: 55, expiryDate: day(6) },
  ]);

  for (let i = 0; i < 20; i++) {
    const store = stores[i % 3];
    const product = products[i % 5];
    const qty = 2 + (i % 5);
    await Sale.create({
      product: product._id,
      store: store._id,
      quantity: qty,
      unitPrice: product.price,
      totalAmount: product.price * qty,
      recordedBy: admin._id,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    });
  }

  await generateRecommendations();

  console.log('Seed complete!');
  console.log('Login: admin@foodflow.com / admin123');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
