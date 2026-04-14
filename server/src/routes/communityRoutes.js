import { Router } from 'express';
import {
  createNewCommunityPost,
  createPostComment,
  flagComment,
  flagPost,
  getCommunityPosts,
  getPostComments,
  removeComment,
  removePost,
  togglePostLike,
} from '../controllers/communityController.js';
import { optionalProtect, protect } from '../middleware/authMiddleware.js';
import { communityUpload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  commentIdParamsSchema,
  createCommentSchema,
  createCommunityPostSchema,
  listCommunityPostsSchema,
  postActionParamsSchema,
  postIdParamsSchema,
} from '../validators/communityValidators.js';

const router = Router();

router.get('/posts', optionalProtect, validateRequest(listCommunityPostsSchema), getCommunityPosts);
router.get('/posts/:id/comments', optionalProtect, validateRequest(postIdParamsSchema), getPostComments);

router.use(protect);
router.post('/posts', communityUpload.single('image'), validateRequest(createCommunityPostSchema), createNewCommunityPost);
router.post('/posts/:id/like', validateRequest(postActionParamsSchema), togglePostLike);
router.post('/posts/:id/comments', validateRequest(createCommentSchema), createPostComment);
router.post('/posts/:id/report', validateRequest(postActionParamsSchema), flagPost);
router.delete('/posts/:id', validateRequest(postActionParamsSchema), removePost);
router.post('/comments/:id/report', validateRequest(commentIdParamsSchema), flagComment);
router.delete('/comments/:id', validateRequest(commentIdParamsSchema), removeComment);

export default router;
