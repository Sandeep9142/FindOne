import { z } from 'zod';
import { USER_ROLES } from '../config/constants.js';
import { emptyParamsSchema, emptyQuerySchema } from './commonSchemas.js';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(6).max(100),
    role: z.enum(USER_ROLES).optional(),
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});
