import mongoose from 'mongoose';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const conversationSchema = new Schema(
  {
    participantIds: [
      {
        type: objectId,
        ref: 'User',
        required: true,
      },
    ],
    jobId: {
      type: objectId,
      ref: 'Job',
      default: null,
    },
    bookingId: {
      type: objectId,
      ref: 'Booking',
      default: null,
    },
    lastMessageId: {
      type: objectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions
);

conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
conversationSchema.index({ jobId: 1 });
conversationSchema.index({ bookingId: 1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
