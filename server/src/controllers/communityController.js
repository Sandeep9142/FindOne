import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  reportCommunityComment,
  reportCommunityPost,
  toggleCommunityPostLike,
} from '../services/communityService.js';
import { toPublicUploadUrl } from '../utils/fileUrl.js';

export const getCommunityPosts = asyncHandler(async (req, res) => {
  const posts = await listCommunityPosts(req.user || null, req.query);

  return sendSuccess(res, {
    message: 'Community posts fetched successfully',
    data: posts,
  });
});

export const createNewCommunityPost = asyncHandler(async (req, res) => {
  const post = await createCommunityPost(req.user, {
    ...req.body,
    mediaUrl: req.file ? toPublicUploadUrl(req.file.path) : '',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Community post created successfully',
    data: post,
  });
});

export const togglePostLike = asyncHandler(async (req, res) => {
  const result = await toggleCommunityPostLike(req.params.id, req.user);

  return sendSuccess(res, {
    message: result.liked ? 'Post liked' : 'Post unliked',
    data: result,
  });
});

export const flagPost = asyncHandler(async (req, res) => {
  const post = await reportCommunityPost(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Post reported successfully',
    data: post,
  });
});

export const removePost = asyncHandler(async (req, res) => {
  await deleteCommunityPost(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Post deleted successfully',
  });
});

export const getPostComments = asyncHandler(async (req, res) => {
  const comments = await listCommunityComments(req.params.id, req.user || null, req.query);

  return sendSuccess(res, {
    message: 'Comments fetched successfully',
    data: comments,
  });
});

export const createPostComment = asyncHandler(async (req, res) => {
  const comment = await createCommunityComment(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Comment added successfully',
    data: comment,
  });
});

export const flagComment = asyncHandler(async (req, res) => {
  const comment = await reportCommunityComment(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Comment reported successfully',
    data: comment,
  });
});

export const removeComment = asyncHandler(async (req, res) => {
  await deleteCommunityComment(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Comment deleted successfully',
  });
});
