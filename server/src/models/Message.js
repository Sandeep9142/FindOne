import mongoose from 'mongoose';
import { MESSAGE_TYPES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const messageReadSchema = new Schema(
  {
    userId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const attachmentSchema = new Schema(
  {
    url: { type: String, trim: true, required: true },
    type: { type: String, trim: true, default: 'file' },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: objectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    messageType: {
      type: String,
      enum: MESSAGE_TYPES,
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [attachmentSchema],
    readBy: [messageReadSchema],
  },
  baseSchemaOptions
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
