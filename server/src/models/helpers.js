import mongoose from 'mongoose';

export const { Schema } = mongoose;
export const objectId = Schema.Types.ObjectId;

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
};
