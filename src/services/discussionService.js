import api from './api';

export function getCourseDiscussions(courseId) {
  return api.get(`/discussions/courses/${courseId}`);
}

export function createDiscussionPost(courseId, content) {
  return api.post(`/discussions/courses/${courseId}`, { content });
}

export function createDiscussionReply(courseId, postId, content) {
  return api.post(`/discussions/courses/${courseId}/posts/${postId}/replies`, { content });
}
