import mongoose from 'mongoose';

/** Use standard (non-SRV) URI on Windows when querySrv ECONNREFUSED occurs */
const resolveUri = () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodflow';
  if (process.env.MONGODB_URI_STANDARD) return process.env.MONGODB_URI_STANDARD;
  if (uri.startsWith('mongodb+srv://')) {
    const withoutProto = uri.replace('mongodb+srv://', '');
    const [authHost, query = ''] = withoutProto.split('?');
    const at = authHost.lastIndexOf('@');
    const auth = authHost.slice(0, at);
    const host = authHost.slice(at + 1).replace(/\/$/, '');
    const db = process.env.MONGODB_DB || 'foodflow';
    const params = new URLSearchParams(query);
    params.set('ssl', 'true');
    params.set('authSource', 'admin');
    if (process.env.MONGODB_REPLICA_SET) params.set('replicaSet', process.env.MONGODB_REPLICA_SET);
    return `mongodb://${auth}@${host}/${db}?${params}`;
  }
  return uri;
};

export const connectDB = async () => {
  const uri = resolveUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
