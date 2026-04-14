import { z } from 'zod';
import { emptyQuerySchema, objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

export const listCommunityPostsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: paginationQuerySchema.extend({
    includeRemoved: z.enum(['true', 'false']).optional(),
  }),
});

export const createCommunityPostSchema = z.object({
  body: z.object({
    content: z.string().trim().max(2000).optional().default(''),
  }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const postIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: paginationQuerySchema.extend({
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

export const postActionParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(1200),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const commentIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});
