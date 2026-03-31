import { z } from 'zod';
import { PAYMENT_STATUSES } from '../config/constants.js';
import { emptyQuerySchema, objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

export const listPaymentsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: paginationQuerySchema.extend({
    status: z.enum(PAYMENT_STATUSES).optional(),
    bookingId: objectIdSchema.optional(),
    jobId: objectIdSchema.optional(),
  }),
});

export const paymentIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createPaymentSchema = z.object({
  body: z
    .object({
      bookingId: objectIdSchema.optional(),
      jobId: objectIdSchema.optional(),
      workerId: objectIdSchema.optional(),
      amount: z.coerce.number().min(0).optional(),
      currency: z.string().trim().min(3).max(10).optional(),
      provider: z.string().trim().min(1).max(50).optional(),
      providerPaymentId: z.string().trim().max(100).optional().nullable(),
      status: z.enum(PAYMENT_STATUSES).optional(),
    })
    .refine((value) => Boolean(value.bookingId) !== Boolean(value.jobId), {
      message: 'Provide exactly one of bookingId or jobId',
      path: ['bookingId'],
    }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(PAYMENT_STATUSES),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});
