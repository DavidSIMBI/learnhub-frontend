import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getCourse } from '../services/courseService';
import { createDiscussionPost, createDiscussionReply, getCourseDiscussions } from '../services/discussionService';

function formatDiscussionDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function Author({ name, role, date }) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 small text-muted mb-2">
      <strong className="text-dark">{name}</strong>
      <span className="badge text-bg-light">{role}</span>
      <time dateTime={date}>{formatDiscussionDate(date)}</time>
    </div>
  );
}

export default function DiscussionForum() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDiscussion = useCallback(async () => {
    setError('');
    try {
      const [courseResponse, discussionResponse] = await Promise.all([
        getCourse(id),
        getCourseDiscussions(id)
      ]);
      setCourse(courseResponse.data);
      setPosts(discussionResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this course discussion.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadDiscussion();
  }, [loadDiscussion]);

  async function handlePostSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await createDiscussionPost(id, content);
      setContent('');
      setMessage('Your discussion post was published.');
      await loadDiscussion();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not publish your post.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(event, postId) {
    event.preventDefault();
    const reply = replyContent[postId] || '';
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await createDiscussionReply(id, postId, reply);
      setReplyContent((current) => ({ ...current, [postId]: '' }));
      setMessage('Your reply was published.');
      await loadDiscussion();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not publish your reply.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading course discussion..." />;

  const courseHome = user?.role === 'teacher'
    ? '/teacher/courses'
    : `/student/courses/${id}/learn`;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <Link className="small text-decoration-none" to={courseHome}>Back to course</Link>
          <h1 className="h3 mt-2 mb-1">{course?.title} discussion</h1>
          <p className="text-muted mb-0">Ask questions and share ideas with your course community.</p>
        </div>
      </div>
      <AlertMessage type="danger" message={error} />
      <AlertMessage type="success" message={message} />

      <section className="content-panel mb-3" aria-labelledby="new-post-heading">
        <h2 id="new-post-heading" className="h5">Start a discussion</h2>
        <form onSubmit={handlePostSubmit}>
          <label className="form-label" htmlFor="discussion-post">Your post</label>
          <textarea
            className="form-control mb-2"
            id="discussion-post"
            rows="3"
            maxLength="5000"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What would you like to discuss?"
            required
          />
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="small text-muted">{content.length}/5000</span>
            <button className="btn btn-primary" type="submit" disabled={submitting || !content.trim()}>
              {submitting ? 'Publishing...' : 'Publish post'}
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Discussion posts">
        {posts.length === 0 ? (
          <div className="content-panel text-center text-muted py-4">
            <h2 className="h5 text-dark">No discussions yet</h2>
            <p className="mb-0">Be the first to start a conversation for this course.</p>
          </div>
        ) : posts.map((post) => (
          <article className="content-panel mb-3" key={post.id}>
            <Author name={post.author_name} role={post.author_role} date={post.created_at} />
            <p className="discussion-content mb-3">{post.content}</p>

            <div className="discussion-replies ms-2 ms-md-4 ps-3">
              {post.replies.map((reply) => (
                <div className="py-3 border-bottom" key={reply.id}>
                  <Author name={reply.author_name} role={reply.author_role} date={reply.created_at} />
                  <p className="discussion-content mb-0">{reply.content}</p>
                </div>
              ))}
              <form className="pt-3" onSubmit={(event) => handleReplySubmit(event, post.id)}>
                <label className="form-label small fw-semibold" htmlFor={`reply-${post.id}`}>Reply</label>
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <textarea
                    className="form-control"
                    id={`reply-${post.id}`}
                    rows="2"
                    maxLength="3000"
                    value={replyContent[post.id] || ''}
                    onChange={(event) => setReplyContent((current) => ({ ...current, [post.id]: event.target.value }))}
                    placeholder="Write a reply..."
                    required
                  />
                  <button
                    className="btn btn-outline-primary align-self-sm-end"
                    type="submit"
                    disabled={submitting || !(replyContent[post.id] || '').trim()}
                  >
                    Reply
                  </button>
                </div>
              </form>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
