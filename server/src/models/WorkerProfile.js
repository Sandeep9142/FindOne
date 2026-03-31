import mongoose from 'mongoose';
import {
  BACKGROUND_CHECK_STATUSES,
  VERIFICATION_STATUSES,
} from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const serviceAreaSchema = new Schema(
  {
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const availabilitySlotSchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const workerProfileSchema = new Schema(
  {
    userId: {
      type: objectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },
    categories: [
      {
        type: objectId,
        ref: 'Category',
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    serviceAreas: [serviceAreaSchema],
    availability: [availabilitySlotSchema],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    portfolioImages: [
      {
        type: String,
        trim: true,
      },
    ],
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    jobsCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
    backgroundCheckStatus: {
      type: String,
      enum: BACKGROUND_CHECK_STATUSES,
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'pending',
    },
    isAvailableNow: {
      type: Boolean,
      default: false,
    },
  },
  baseSchemaOptions
);

workerProfileSchema.index({ categories: 1 });
workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ isAvailableNow: 1, verificationStatus: 1 });
workerProfileSchema.index({ ratingAverage: -1, jobsCompleted: -1 });
workerProfileSchema.index({ headline: 'text', bio: 'text', skills: 'text' });

export default mongoose.models.WorkerProfile || mongoose.model('WorkerProfile', workerProfileSchema);
