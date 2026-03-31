import mongoose from 'mongoose';
import { BUDGET_TYPES, JOB_STATUSES, JOB_URGENCY, PAYMENT_STATUSES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const locationSchema = new Schema(
  {
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    clientId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: objectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: locationSchema,
      required: true,
    },
    budgetType: {
      type: String,
      enum: BUDGET_TYPES,
      required: true,
    },
    budgetMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    budgetMax: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'open',
    },
    urgency: {
      type: String,
      enum: JOB_URGENCY,
      default: 'medium',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    assignedWorkerId: {
      type: objectId,
      ref: 'User',
      default: null,
    },
    applicationCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
  },
  baseSchemaOptions
);

jobSchema.index({ clientId: 1, createdAt: -1 });
jobSchema.index({ categoryId: 1, status: 1 });
jobSchema.index({ assignedWorkerId: 1, status: 1 });
jobSchema.index({ scheduledDate: 1, status: 1 });
jobSchema.index({ status: 1, paymentStatus: 1 });
jobSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
