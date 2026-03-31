import mongoose from 'mongoose';
import { PAYMENT_STATUSES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const paymentSchema = new Schema(
  {
    bookingId: {
      type: objectId,
      ref: 'Booking',
      default: undefined,
    },
    jobId: {
      type: objectId,
      ref: 'Job',
      default: undefined,
    },
    clientId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    workerId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
    },
    provider: {
      type: String,
      trim: true,
      default: 'manual',
    },
    providerPaymentId: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions
);

paymentSchema.index({ clientId: 1, createdAt: -1 });
paymentSchema.index({ workerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
