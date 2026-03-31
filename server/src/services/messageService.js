import { Booking, Conversation, Job, Message, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

function getIdValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

async function ensureUser(userId) {
  const user = await User.findById(userId).select('_id fullName email avatarUrl role isVerified');

  if (!user) {
    throw new AppError('Participant not found', 404);
  }

  return user;
}

async function ensureRelatedResources({ jobId, bookingId }) {
  if (jobId) {
    const job = await Job.findById(jobId).select('_id clientId assignedWorkerId');
    if (!job) {
      throw new AppError('Job not found', 404);
    }
  }

  if (bookingId) {
    const booking = await Booking.findById(bookingId).select('_id clientId workerId');
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
  }
}

async function getConversationOrThrow(conversationId) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
}

function ensureConversationParticipant(conversation, userId) {
  const requesterId = getIdValue(userId);
  const isParticipant = conversation.participantIds.some((participantId) => getIdValue(participantId) === requesterId);

  if (!isParticipant) {
    throw new AppError('You do not have permission to access this conversation', 403);
  }
}

async function populateConversation(query) {
  return query
    .populate('participantIds', 'fullName email avatarUrl role isVerified')
    .populate('jobId', 'title status')
    .populate('bookingId', 'title status bookingDate')
    .populate({
      path: 'lastMessageId',
      populate: {
        path: 'senderId',
        select: 'fullName avatarUrl role isVerified',
      },
    });
}

export async function listConversations(user) {
  const conversations = await populateConversation(
    Conversation.find({ participantIds: user._id }).sort({ lastMessageAt: -1, updatedAt: -1 })
  );

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        senderId: { $ne: user._id },
        'readBy.userId': { $ne: user._id },
      });

      return {
        ...conversation.toObject(),
        unreadCount,
      };
    })
  );

  return conversationsWithUnread;
}

export async function createConversation(requester, payload) {
  const participantId = payload.participantId;

  if (!participantId) {
    throw new AppError('participantId is required', 400);
  }

  const requesterId = getIdValue(requester._id);
  const otherParticipantId = getIdValue(participantId);

  if (requesterId === otherParticipantId) {
    throw new AppError('You cannot create a conversation with yourself', 400);
  }

  await ensureUser(otherParticipantId);
  await ensureRelatedResources(payload);

  const sortedParticipants = [requesterId, otherParticipantId].sort();

  const existingConversation = await populateConversation(
    Conversation.findOne({
      participantIds: { $all: sortedParticipants, $size: 2 },
      jobId: payload.jobId || null,
      bookingId: payload.bookingId || null,
    })
  );

  if (existingConversation) {
    return existingConversation;
  }

  const conversation = await Conversation.create({
    participantIds: sortedParticipants,
    jobId: payload.jobId || null,
    bookingId: payload.bookingId || null,
  });

  return populateConversation(Conversation.findById(conversation._id));
}

export async function getConversationById(conversationId, requester) {
  const conversation = await populateConversation(Conversation.findById(conversationId));

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  ensureConversationParticipant(conversation, requester._id);

  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    senderId: { $ne: requester._id },
    'readBy.userId': { $ne: requester._id },
  });

  return {
    ...conversation.toObject(),
    unreadCount,
  };
}

export async function listMessages(conversationId, requester) {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationParticipant(conversation, requester._id);

  const messages = await Message.find({ conversationId })
    .populate('senderId', 'fullName avatarUrl role isVerified')
    .sort({ createdAt: 1 });

  return messages;
}

export async function sendMessage(conversationId, requester, payload) {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationParticipant(conversation, requester._id);

  const text = payload.text ? String(payload.text).trim() : '';
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  if (!text && attachments.length === 0) {
    throw new AppError('Message text or attachments are required', 400);
  }

  const message = await Message.create({
    conversationId,
    senderId: requester._id,
    messageType: payload.messageType || 'text',
    text,
    attachments,
    readBy: [{ userId: requester._id, readAt: new Date() }],
  });

  conversation.lastMessageId = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return Message.findById(message._id).populate('senderId', 'fullName avatarUrl role isVerified');
}

export async function markConversationAsRead(conversationId, requester) {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationParticipant(conversation, requester._id);

  const unreadMessages = await Message.find({
    conversationId,
    senderId: { $ne: requester._id },
    'readBy.userId': { $ne: requester._id },
  });

  await Promise.all(
    unreadMessages.map((message) =>
      Message.updateOne(
        { _id: message._id },
        { $push: { readBy: { userId: requester._id, readAt: new Date() } } }
      )
    )
  );

  return {
    conversationId,
    markedCount: unreadMessages.length,
  };
}
