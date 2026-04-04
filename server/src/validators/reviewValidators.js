import { z } from 'zod';
import { emptyParamsSchema, emptyQuerySchema } from './commonSchemas.js';

export const listTestimonialsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: emptyParamsSchema,
  query: emptyQuerySchema.extend({
    limit: z.coerce.number().int().min(1).max(12).optional(),
  }),
});
