import mongoose from 'mongoose';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const reviewSchema = new Schema(
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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  baseSchemaOptions
);

reviewSchema.index({ workerId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ jobId: 1 }, { unique: true, sparse: true });

reviewSchema.pre('validate', function validateSource(next) {
  if (!this.bookingId && !this.jobId) {
    next(new Error('Review must reference either a booking or a job'));
    return;
  }

  next();
});

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
