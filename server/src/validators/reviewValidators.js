import { z } from 'zod';
import { emptyQuerySchema, objectIdSchema } from './commonSchemas.js';

export const listTestimonialsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: emptyQuerySchema.extend({
    limit: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export const createWorkerReviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});
