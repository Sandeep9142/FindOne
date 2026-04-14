import mongoose from 'mongoose';
import { USER_ROLES } from '../config/constants.js';
import { Schema, baseSchemaOptions, objectId } from './helpers.js';

const communityCommentSchema = new Schema(
  {
    postId: {
      type: objectId,
      ref: 'CommunityPost',
      required: true,
    },
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
      required: true,
      maxlength: 1200,
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

communityCommentSchema.index({ postId: 1, createdAt: 1 });
communityCommentSchema.index({ authorId: 1, createdAt: -1 });
communityCommentSchema.index({ isRemoved: 1, createdAt: -1 });

export default mongoose.models.CommunityComment || mongoose.model('CommunityComment', communityCommentSchema);
