import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Flag,
  Heart,
  ImagePlus,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import Button from '@components/common/Button';
import { communityService } from '@services';
import { useAuthStore, useUIStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

function roleBadgeTone(role) {
  if (role === 'admin') {
    return 'bg-rose-100 text-rose-700';
  }

  if (role === 'worker') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-emerald-100 text-emerald-700';
}

function initialFromName(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showToast = useUIStore((state) => state.showToast);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [actionLoadingByPost, setActionLoadingByPost] = useState({});
  const [expandedPostIds, setExpandedPostIds] = useState({});
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState({});
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState({});
  const [submittingCommentByPostId, setSubmittingCommentByPostId] = useState({});
  const [commentActionLoadingById, setCommentActionLoadingById] = useState({});

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
      ),
    [posts]
  );

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);

      try {
        const postList = await communityService.getPosts({ limit: 30 });
        setPosts(Array.isArray(postList) ? postList : []);
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load community posts.'), 'error');
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [showToast]);

  useEffect(() => {
    if (!postImage) {
      setPostImagePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(postImage);
    setPostImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [postImage]);

  function requireAuth(actionLabel) {
    if (isAuthenticated) {
      return true;
    }

    showToast(`Please log in to ${actionLabel}.`, 'error');
    navigate('/login', { state: { from: location } });
    return false;
  }

  function resetComposer() {
    setPostContent('');
    setPostImage(null);
    setPostImagePreview('');
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    if (!requireAuth('post in community')) {
      return;
    }

    const trimmedContent = postContent.trim();
    if (!trimmedContent && !postImage) {
      showToast('Add some text or choose an image for your post.', 'error');
      return;
    }

    setCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', trimmedContent);
      if (postImage) {
        formData.append('image', postImage);
      }

      const newPost = await communityService.createPost(formData);
      setPosts((current) => [newPost, ...current]);
      resetComposer();
      showToast('Post published to the community');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to publish post.'), 'error');
    } finally {
      setCreatingPost(false);
    }
  }

  async function handleToggleLike(postId) {
    if (!requireAuth('like posts')) {
      return;
    }

    setActionLoadingByPost((current) => ({ ...current, [postId]: true }));
    try {
      const result = await communityService.toggleLike(postId);
      if (result?.post?._id) {
        setPosts((current) =>
          current.map((post) => (post._id === postId ? result.post : post))
        );
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update like.'), 'error');
    } finally {
      setActionLoadingByPost((current) => ({ ...current, [postId]: false }));
    }
  }

  async function handleReportPost(postId) {
    if (!requireAuth('report posts')) {
      return;
    }

    setActionLoadingByPost((current) => ({ ...current, [postId]: true }));
    try {
      const updatedPost = await communityService.reportPost(postId);
      setPosts((current) =>
        current.map((post) => (post._id === postId ? updatedPost : post))
      );
      showToast('Post reported. Our team will review it.');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to report post.'), 'error');
    } finally {
      setActionLoadingByPost((current) => ({ ...current, [postId]: false }));
    }
  }

  async function handleDeletePost(postId) {
    if (!requireAuth('delete posts')) {
      return;
    }

    setActionLoadingByPost((current) => ({ ...current, [postId]: true }));
    try {
      await communityService.deletePost(postId);
      setPosts((current) => current.filter((post) => post._id !== postId));
      setCommentsByPostId((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      showToast('Post removed');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to delete post.'), 'error');
    } finally {
      setActionLoadingByPost((current) => ({ ...current, [postId]: false }));
    }
  }

  async function loadComments(postId) {
    setCommentsLoadingByPostId((current) => ({ ...current, [postId]: true }));
    try {
      const comments = await communityService.getComments(postId, { limit: 150 });
      setCommentsByPostId((current) => ({ ...current, [postId]: comments || [] }));
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load comments.'), 'error');
    } finally {
      setCommentsLoadingByPostId((current) => ({ ...current, [postId]: false }));
    }
  }

  async function toggleComments(postId) {
    const isExpanded = Boolean(expandedPostIds[postId]);

    setExpandedPostIds((current) => ({
      ...current,
      [postId]: !isExpanded,
    }));

    if (!isExpanded && !commentsByPostId[postId]) {
      await loadComments(postId);
    }
  }

  async function handleSubmitComment(event, postId) {
    event.preventDefault();
    if (!requireAuth('comment')) {
      return;
    }

    const content = String(commentDraftByPostId[postId] || '').trim();
    if (!content) {
      return;
    }

    setSubmittingCommentByPostId((current) => ({ ...current, [postId]: true }));
    try {
      const comment = await communityService.createComment(postId, { content });
      setCommentsByPostId((current) => {
        const existingComments = Array.isArray(current[postId]) ? current[postId] : [];
        return {
          ...current,
          [postId]: [...existingComments, comment],
        };
      });
      setPosts((current) =>
        current.map((post) =>
          post._id === postId
            ? { ...post, commentCount: Number(post.commentCount || 0) + 1 }
            : post
        )
      );
      setCommentDraftByPostId((current) => ({ ...current, [postId]: '' }));
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to add comment.'), 'error');
    } finally {
      setSubmittingCommentByPostId((current) => ({ ...current, [postId]: false }));
    }
  }

  async function handleReportComment(commentId, postId) {
    if (!requireAuth('report comments')) {
      return;
    }

    setCommentActionLoadingById((current) => ({ ...current, [commentId]: true }));
    try {
      const updatedComment = await communityService.reportComment(commentId);
      setCommentsByPostId((current) => ({
        ...current,
        [postId]: (current[postId] || []).map((comment) =>
          comment._id === commentId ? updatedComment : comment
        ),
      }));
      showToast('Comment reported. Thanks for helping keep the community safe.');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to report comment.'), 'error');
    } finally {
      setCommentActionLoadingById((current) => ({ ...current, [commentId]: false }));
    }
  }

  async function handleDeleteComment(commentId, postId) {
    if (!requireAuth('delete comments')) {
      return;
    }

    setCommentActionLoadingById((current) => ({ ...current, [commentId]: true }));
    try {
      await communityService.deleteComment(commentId);
      setCommentsByPostId((current) => ({
        ...current,
        [postId]: (current[postId] || []).filter((comment) => comment._id !== commentId),
      }));
      setPosts((current) =>
        current.map((post) =>
          post._id === postId
            ? { ...post, commentCount: Math.max(0, Number(post.commentCount || 0) - 1) }
            : post
        )
      );
      showToast('Comment deleted');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to delete comment.'), 'error');
    } finally {
      setCommentActionLoadingById((current) => ({ ...current, [commentId]: false }));
    }
  }

  return (
    <div className="container-app py-28">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community</h1>
          <p className="mt-2 text-slate-500">
            Share updates, ask questions, and help workers and clients grow together.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Create post</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreatePost}>
            <textarea
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="What would you like to share with the community?"
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
              maxLength={2000}
            />

            {postImagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={postImagePreview} alt="Post preview" className="max-h-72 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPostImage(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-1 text-white"
                  aria-label="Remove selected image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <ImagePlus size={16} />
                Add image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setPostImage(event.target.files?.[0] || null)}
                />
              </label>

              <Button type="submit" variant="primary" size="sm" loading={creatingPost}>
                Publish post
              </Button>
            </div>
          </form>
        </section>

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
              Loading community posts...
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
              No posts yet. Start the first conversation.
            </div>
          ) : (
            sortedPosts.map((post) => {
              const postAuthor = post.author || {};
              const isExpanded = Boolean(expandedPostIds[post._id]);
              const comments = commentsByPostId[post._id] || [];
              const commentsLoading = Boolean(commentsLoadingByPostId[post._id]);
              const postActionLoading = Boolean(actionLoadingByPost[post._id]);

              return (
                <article key={post._id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700">
                        {postAuthor.avatarUrl ? (
                          <img src={postAuthor.avatarUrl} alt={postAuthor.fullName || 'Member'} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold">{initialFromName(postAuthor.fullName)}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-900">{postAuthor.fullName || 'Member'}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${roleBadgeTone(postAuthor.role || post.role)}`}>
                            {postAuthor.role || post.role}
                          </span>
                          {postAuthor.isVerified ? <ShieldCheck size={14} className="text-emerald-600" /> : null}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(post.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.canDelete ? (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                          onClick={() => handleDeletePost(post._id)}
                          disabled={postActionLoading}
                          aria-label="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                          onClick={() => handleReportPost(post._id)}
                          disabled={postActionLoading || post.reportedByMe}
                          aria-label="Report post"
                        >
                          <Flag size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {post.content ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.content}</p> : null}
                  {post.mediaUrl ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                      <img src={post.mediaUrl} alt="Post attachment" className="max-h-[26rem] w-full object-cover" />
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post._id)}
                      disabled={postActionLoading}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        post.likedByMe
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Heart size={14} className={post.likedByMe ? 'fill-current' : ''} />
                      {post.likeCount} {post.likeCount === 1 ? 'Like' : 'Likes'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleComments(post._id)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <MessageCircle size={14} />
                      {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {commentsLoading ? (
                        <div className="rounded-xl bg-white px-3 py-4 text-center text-sm text-slate-500">
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="rounded-xl bg-white px-3 py-4 text-center text-sm text-slate-500">
                          No comments yet. Start the discussion.
                        </div>
                      ) : (
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                          {comments.map((comment) => (
                            <div key={comment._id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-700">{comment.author?.fullName || 'Member'}</p>
                                  <p className="text-[11px] text-slate-400">{formatDateTime(comment.createdAt)}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                  {comment.canDelete ? (
                                    <button
                                      type="button"
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                      onClick={() => handleDeleteComment(comment._id, post._id)}
                                      disabled={Boolean(commentActionLoadingById[comment._id])}
                                      aria-label="Delete comment"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                                      onClick={() => handleReportComment(comment._id, post._id)}
                                      disabled={Boolean(commentActionLoadingById[comment._id]) || comment.reportedByMe}
                                      aria-label="Report comment"
                                    >
                                      <Flag size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form className="mt-3 flex items-center gap-2" onSubmit={(event) => handleSubmitComment(event, post._id)}>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                          placeholder="Write a comment..."
                          value={commentDraftByPostId[post._id] || ''}
                          onChange={(event) =>
                            setCommentDraftByPostId((current) => ({
                              ...current,
                              [post._id]: event.target.value,
                            }))
                          }
                          maxLength={1200}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          loading={Boolean(submittingCommentByPostId[post._id])}
                        >
                          <Send size={14} />
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
