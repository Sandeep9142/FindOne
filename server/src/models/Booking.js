import mongoose from 'mongoose';
import { BOOKING_STATUSES, BUDGET_TYPES, PAYMENT_STATUSES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const bookingAddressSchema = new Schema(
  {
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
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
    categoryId: {
      type: objectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: bookingAddressSchema,
      required: true,
    },
    pricingType: {
      type: String,
      enum: BUDGET_TYPES,
      default: 'fixed',
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  baseSchemaOptions
);

bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ workerId: 1, bookingDate: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
