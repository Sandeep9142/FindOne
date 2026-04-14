import mongoose from 'mongoose';
import { APPLICATION_STATUSES, USER_ROLES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const applicationStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    changedBy: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    changedByRole: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const jobApplicationSchema = new Schema(
  {
    jobId: {
      type: objectId,
      ref: 'Job',
      required: true,
    },
    workerId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    coverMessage: {
      type: String,
      trim: true,
      default: '',
    },
    proposedRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'applied',
    },
    statusHistory: {
      type: [applicationStatusHistorySchema],
      default: [],
    },
  },
  baseSchemaOptions
);

jobApplicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });
jobApplicationSchema.index({ workerId: 1, status: 1, createdAt: -1 });

export default mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);
