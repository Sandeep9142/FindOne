import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export default async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongodbUri);
  isConnected = true;

  console.log('MongoDB connected');

  return mongoose.connection;
}
