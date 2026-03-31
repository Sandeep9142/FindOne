import mongoose from 'mongoose';
import { Schema, baseSchemaOptions } from './helpers.js';

const categorySchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  baseSchemaOptions
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
