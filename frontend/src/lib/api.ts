import axios from 'axios';
import { getApiBaseUrl } from '@/lib/env';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('foodflow_token');
      localStorage.removeItem('foodflow_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export type User = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'store_manager';
  store?: { _id: string; name: string };
};

export type Store = {
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
};

export type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  shelfLife: number;
};

export type InventoryItem = {
  _id: string;
  product: Product;
  store: Store;
  quantity: number;
  expiryDate: string;
  expiryStatus?: 'ok' | 'warning' | 'critical';
};

export type Sale = {
  _id: string;
  product: Product;
  store: Store;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
};

export type Recommendation = {
  _id: string;
  product: Product;
  fromStore: Store;
  toStore: Store;
  suggestedQuantity: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
};
