import mongoose from 'mongoose';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const locationSchema = new Schema(
  {
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const clientProfileSchema = new Schema(
  {
    userId: {
      type: objectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    preferredLocations: [locationSchema],
  },
  baseSchemaOptions
);

export default mongoose.models.ClientProfile || mongoose.model('ClientProfile', clientProfileSchema);
