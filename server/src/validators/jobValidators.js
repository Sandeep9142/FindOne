import { z } from 'zod';
import { APPLICATION_STATUSES, BUDGET_TYPES, JOB_STATUSES, JOB_URGENCY } from '../config/constants.js';
import { emptyQuerySchema, objectIdSchema, optionalObjectIdSchema, paginationQuerySchema } from './commonSchemas.js';

const locationSchema = z.object({
  addressLine: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  pincode: z.string().trim().optional(),
  coordinates: z
    .object({
      lat: z.number().optional().nullable(),
      lng: z.number().optional().nullable(),
    })
    .optional(),
});

export const listJobsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: paginationQuerySchema.extend({
    q: z.string().trim().optional(),
    status: z.enum(JOB_STATUSES).optional(),
    categoryId: objectIdSchema.optional(),
    clientId: objectIdSchema.optional(),
    assignedWorkerId: objectIdSchema.optional(),
    openOnly: z.enum(['true', 'false']).optional(),
  }),
});

export const jobIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createJobSchema = z.object({
  body: z.object({
    categoryId: objectIdSchema,
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10),
    skillsRequired: z.array(z.string().trim().min(1)).optional().default([]),
    location: locationSchema,
    budgetType: z.enum(BUDGET_TYPES),
    budgetMin: z.coerce.number().min(0).optional().default(0),
    budgetMax: z.coerce.number().min(0).optional().default(0),
    urgency: z.enum(JOB_URGENCY).optional(),
    scheduledDate: z.string().datetime().optional().nullable(),
  }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const updateJobSchema = z.object({
  body: z.object({
    categoryId: optionalObjectIdSchema,
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).optional(),
    skillsRequired: z.array(z.string().trim().min(1)).optional(),
    location: locationSchema.partial().optional(),
    budgetType: z.enum(BUDGET_TYPES).optional(),
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    urgency: z.enum(JOB_URGENCY).optional(),
    status: z.enum(JOB_STATUSES).optional(),
    scheduledDate: z.string().datetime().optional().nullable(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const applyToJobSchema = z.object({
  body: z.object({
    coverMessage: z.string().trim().max(2000).optional(),
    proposedRate: z.coerce.number().min(0).optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});
