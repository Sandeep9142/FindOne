import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  createConversation,
  getConversationById,
  listConversations,
  listMessages,
  markConversationAsRead,
  sendMessage,
} from '../services/messageService.js';

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await listConversations(req.user);

  return sendSuccess(res, {
    message: 'Conversations fetched successfully',
    data: conversations,
  });
});

export const createNewConversation = asyncHandler(async (req, res) => {
  const conversation = await createConversation(req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Conversation created successfully',
    data: conversation,
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await getConversationById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Conversation fetched successfully',
    data: conversation,
  });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const messages = await listMessages(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Messages fetched successfully',
    data: messages,
  });
});

export const createMessage = asyncHandler(async (req, res) => {
  const message = await sendMessage(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Message sent successfully',
    data: message,
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await markConversationAsRead(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Conversation marked as read',
    data: result,
  });
});
