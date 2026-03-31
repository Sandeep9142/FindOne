import { Router } from 'express';
import {
  createMessage,
  createNewConversation,
  getConversation,
  getConversationMessages,
  getConversations,
  markRead,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  conversationIdParamsSchema,
  createConversationSchema,
  createMessageSchema,
  listConversationsSchema,
} from '../validators/conversationValidators.js';

const router = Router();

router.use(protect);
router.get('/', validateRequest(listConversationsSchema), getConversations);
router.post('/', validateRequest(createConversationSchema), createNewConversation);
router.get('/:id', validateRequest(conversationIdParamsSchema), getConversation);
router.get('/:id/messages', validateRequest(conversationIdParamsSchema), getConversationMessages);
router.post('/:id/messages', validateRequest(createMessageSchema), createMessage);
router.patch('/:id/read', validateRequest(conversationIdParamsSchema), markRead);

export default router;
