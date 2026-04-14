import mongoose from 'mongoose';
import { USER_ROLES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const communityPostSchema = new Schema(
  {
    authorId: {
      type: objectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    mediaUrl: {
      type: String,
      trim: true,
      default: '',
    },
    likes: [
      {
        type: objectId,
        ref: 'User',
      },
    ],
    likeCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    commentCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    reportedBy: [
      {
        type: objectId,
        ref: 'User',
      },
    ],
    reportCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removedBy: {
      type: objectId,
      ref: 'User',
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ isRemoved: 1, createdAt: -1 });

export default mongoose.models.CommunityPost || mongoose.model('CommunityPost', communityPostSchema);
