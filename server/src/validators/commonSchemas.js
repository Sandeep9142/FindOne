import { z } from 'zod';

const objectIdPattern = /^[a-f\d]{24}$/i;

export const objectIdSchema = z.string().regex(objectIdPattern, 'Invalid id format');
export const optionalObjectIdSchema = objectIdSchema.optional();

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const emptyParamsSchema = z.object({});
export const emptyQuerySchema = z.object({});
