import { z } from 'zod';
import { BOOKING_STATUSES, BUDGET_TYPES } from '../config/constants.js';
import { emptyQuerySchema, objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

const addressSchema = z.object({
  addressLine: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  pincode: z.string().trim().optional(),
});

export const listBookingsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: paginationQuerySchema.extend({
    status: z.enum(BOOKING_STATUSES).optional(),
  }),
});

export const bookingIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createBookingSchema = z.object({
  body: z.object({
    workerId: objectIdSchema,
    categoryId: objectIdSchema,
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().optional(),
    bookingDate: z.string().datetime(),
    timeSlot: z.string().trim().optional(),
    address: addressSchema,
    pricingType: z.enum(BUDGET_TYPES).optional(),
    amount: z.coerce.number().min(0),
    notes: z.string().trim().optional(),
  }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const updateBookingSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().optional(),
    bookingDate: z.string().datetime().optional(),
    timeSlot: z.string().trim().optional(),
    address: addressSchema.partial().optional(),
    pricingType: z.enum(BUDGET_TYPES).optional(),
    amount: z.coerce.number().min(0).optional(),
    notes: z.string().trim().optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const bookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(BOOKING_STATUSES),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createBookingReviewSchema = z.object({
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
