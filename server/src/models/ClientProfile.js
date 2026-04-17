import mongoose from 'mongoose';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const locationSchema = new Schema(
  {
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
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
