import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 7000,
});

export default http;

// Helper APIs (tree-shake friendly named exports)
export const apiPosts = {
  list: (params = {}) => http.get('/posts', { params }),
  detail: (id) => http.get(`/posts/${id}`),
};

export const apiComments = {
  listByPost: (postId) => http.get('/comments', { params: { post_id: postId } }),
  create: (payload) => http.post('/comments', payload),
};

export const apiMeta = {
  categories: () => http.get('/categories'),
  tags: () => http.get('/tags'),
};

export const apiHot = {
  list: () => http.get('/hotdata'),
};

export const apiLike = {
  toggleForPost: (userId, postId) => http.post('/like/toggle', { user_id: userId, post_id: postId }),
  countForPost: (postId) => http.get('/like/count', { params: { post_id: postId } }),
};
