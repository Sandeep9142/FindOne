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
      mode: z.enum(['online', 'cash']).optional(),
    })
    .refine((value) => Boolean(value.bookingId) !== Boolean(value.jobId), {
      message: 'Provide exactly one of bookingId or jobId',
      path: ['bookingId'],
    }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
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
