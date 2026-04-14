import { CommunityComment, CommunityPost } from '../models/index.js';
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

function normalizeLimit(limit, fallback = 20, max = 50) {
  const parsed = Number(limit || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function canDeleteByUser(itemAuthorId, requester) {
  const requesterId = getIdValue(requester?._id);
  return requester?.role === 'admin' || getIdValue(itemAuthorId) === requesterId;
}

function formatPost(post, requester = null) {
  const requesterId = getIdValue(requester?._id);
  const postId = getIdValue(post?._id);
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const reports = Array.isArray(post.reportedBy) ? post.reportedBy : [];

  return {
    _id: postId,
    author: post.authorId && typeof post.authorId === 'object'
      ? {
          _id: getIdValue(post.authorId._id || post.authorId),
          fullName: post.authorId.fullName || 'Member',
          avatarUrl: post.authorId.avatarUrl || '',
          role: post.authorId.role || post.role || 'client',
          isVerified: Boolean(post.authorId.isVerified),
        }
      : null,
    role: post.role,
    content: post.content || '',
    mediaUrl: post.mediaUrl || '',
    likeCount: Number(post.likeCount || 0),
    commentCount: Number(post.commentCount || 0),
    reportCount: Number(post.reportCount || 0),
    likedByMe: requesterId ? likes.some((id) => getIdValue(id) === requesterId) : false,
    reportedByMe: requesterId ? reports.some((id) => getIdValue(id) === requesterId) : false,
    canDelete: requester ? canDeleteByUser(post.authorId?._id || post.authorId, requester) : false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function formatComment(comment, requester = null) {
  const requesterId = getIdValue(requester?._id);
  const reports = Array.isArray(comment.reportedBy) ? comment.reportedBy : [];

  return {
    _id: getIdValue(comment._id),
    postId: getIdValue(comment.postId),
    author: comment.authorId && typeof comment.authorId === 'object'
      ? {
          _id: getIdValue(comment.authorId._id || comment.authorId),
          fullName: comment.authorId.fullName || 'Member',
          avatarUrl: comment.authorId.avatarUrl || '',
          role: comment.authorId.role || comment.role || 'client',
          isVerified: Boolean(comment.authorId.isVerified),
        }
      : null,
    role: comment.role,
    content: comment.content || '',
    reportCount: Number(comment.reportCount || 0),
    reportedByMe: requesterId ? reports.some((id) => getIdValue(id) === requesterId) : false,
    canDelete: requester ? canDeleteByUser(comment.authorId?._id || comment.authorId, requester) : false,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

async function getPostById(postId, { includeRemoved = false } = {}) {
  const filters = { _id: postId };
  if (!includeRemoved) {
    filters.isRemoved = false;
  }

  return CommunityPost.findOne(filters).populate('authorId', 'fullName avatarUrl role isVerified');
}

async function getCommentById(commentId, { includeRemoved = false } = {}) {
  const filters = { _id: commentId };
  if (!includeRemoved) {
    filters.isRemoved = false;
  }

  return CommunityComment.findOne(filters).populate('authorId', 'fullName avatarUrl role isVerified');
}

export async function listCommunityPosts(requester, query = {}) {
  const limit = normalizeLimit(query.limit, 20, 50);
  const filters = {};

  if (!(requester?.role === 'admin' && query.includeRemoved === 'true')) {
    filters.isRemoved = false;
  }

  const posts = await CommunityPost.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('authorId', 'fullName avatarUrl role isVerified');

  return posts.map((post) => formatPost(post, requester));
}

export async function createCommunityPost(requester, payload) {
  const content = String(payload.content || '').trim();
  const mediaUrl = String(payload.mediaUrl || '').trim();

  if (!content && !mediaUrl) {
    throw new AppError('Post content or image is required', 400);
  }

  const post = await CommunityPost.create({
    authorId: requester._id,
    role: requester.role,
    content,
    mediaUrl,
  });

  const populated = await getPostById(post._id, { includeRemoved: true });
  return formatPost(populated, requester);
}

export async function toggleCommunityPostLike(postId, requester) {
  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false });
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const requesterId = getIdValue(requester._id);
  const hasLiked = post.likes.some((likeUserId) => getIdValue(likeUserId) === requesterId);

  if (hasLiked) {
    post.likes = post.likes.filter((likeUserId) => getIdValue(likeUserId) !== requesterId);
  } else {
    post.likes.push(requester._id);
  }

  post.likeCount = post.likes.length;
  await post.save();

  const populated = await getPostById(post._id, { includeRemoved: true });
  return {
    liked: !hasLiked,
    post: formatPost(populated, requester),
  };
}

export async function reportCommunityPost(postId, requester) {
  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false });
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const requesterId = getIdValue(requester._id);
  const hasReported = post.reportedBy.some((reportUserId) => getIdValue(reportUserId) === requesterId);

  if (!hasReported) {
    post.reportedBy.push(requester._id);
    post.reportCount = post.reportedBy.length;
    await post.save();
  }

  const populated = await getPostById(post._id, { includeRemoved: true });
  return formatPost(populated, requester);
}

export async function deleteCommunityPost(postId, requester) {
  const post = await CommunityPost.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (!canDeleteByUser(post.authorId, requester)) {
    throw new AppError('You do not have permission to delete this post', 403);
  }

  await CommunityComment.deleteMany({ postId: post._id });
  await post.deleteOne();
}

export async function listCommunityComments(postId, requester, query = {}) {
  const limit = normalizeLimit(query.limit, 50, 200);

  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false }).select('_id');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comments = await CommunityComment.find({ postId, isRemoved: false })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('authorId', 'fullName avatarUrl role isVerified');

  return comments.map((comment) => formatComment(comment, requester));
}

export async function createCommunityComment(postId, requester, payload) {
  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false });
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const content = String(payload.content || '').trim();
  if (!content) {
    throw new AppError('Comment content is required', 400);
  }

  const comment = await CommunityComment.create({
    postId,
    authorId: requester._id,
    role: requester.role,
    content,
  });

  post.commentCount = Math.max(0, Number(post.commentCount || 0) + 1);
  await post.save();

  const populated = await getCommentById(comment._id, { includeRemoved: true });
  return formatComment(populated, requester);
}

export async function reportCommunityComment(commentId, requester) {
  const comment = await CommunityComment.findOne({ _id: commentId, isRemoved: false });
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const requesterId = getIdValue(requester._id);
  const hasReported = comment.reportedBy.some((reportUserId) => getIdValue(reportUserId) === requesterId);

  if (!hasReported) {
    comment.reportedBy.push(requester._id);
    comment.reportCount = comment.reportedBy.length;
    await comment.save();
  }

  const populated = await getCommentById(comment._id, { includeRemoved: true });
  return formatComment(populated, requester);
}

export async function deleteCommunityComment(commentId, requester) {
  const comment = await CommunityComment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (!canDeleteByUser(comment.authorId, requester)) {
    throw new AppError('You do not have permission to delete this comment', 403);
  }

  await comment.deleteOne();

  const post = await CommunityPost.findById(comment.postId);
  if (post) {
    post.commentCount = Math.max(0, Number(post.commentCount || 0) - 1);
    await post.save();
  }
}
