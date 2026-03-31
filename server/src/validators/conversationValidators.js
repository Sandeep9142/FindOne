import { z } from 'zod';
import { emptyQuerySchema, objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

export const listConversationsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: paginationQuerySchema,
});

export const createConversationSchema = z.object({
  body: z.object({
    participantId: objectIdSchema,
    jobId: objectIdSchema.optional(),
    bookingId: objectIdSchema.optional(),
  }),
  params: z.object({}),
  query: emptyQuerySchema,
});

export const conversationIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});

export const createMessageSchema = z.object({
  body: z
    .object({
      messageType: z.enum(['text', 'image', 'system']).optional(),
      text: z.string().trim().max(5000).optional(),
      attachments: z
        .array(
          z.object({
            url: z.string().trim().url(),
            type: z.string().trim().optional(),
          })
        )
        .optional()
        .default([]),
    })
    .refine((value) => Boolean(value.text) || value.attachments.length > 0, {
      message: 'Message text or attachments are required',
      path: ['text'],
    }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuerySchema,
});
