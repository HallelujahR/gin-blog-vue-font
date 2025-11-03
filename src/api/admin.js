import http from './index.js';

// 后台管理API模块
const adminHttp = http;

export const apiAdminAuth = {
  login: (username, password) => adminHttp.post('/users/login', { username, password }),
  logout: () => {
    // 前端清除token，实际的登出由后端处理
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
};

export const apiAdminPosts = {
  list: (params = {}) => adminHttp.get('/posts', { params }),
  detail: (id) => adminHttp.get(`/posts/${id}`),
  create: (payload) => adminHttp.post('/admin/posts', payload),
  update: (id, payload) => adminHttp.put(`/admin/posts/${id}`, payload),
  delete: (id) => adminHttp.delete(`/admin/posts/${id}`),
};

export const apiAdminCategories = {
  list: () => adminHttp.get('/categories'),
  create: (payload) => adminHttp.post('/admin/categories', payload),
  update: (id, payload) => adminHttp.put(`/admin/categories/${id}`, payload),
  delete: (id) => adminHttp.delete(`/admin/categories/${id}`),
};

export const apiAdminTags = {
  list: () => adminHttp.get('/tags'),
  create: (payload) => adminHttp.post('/admin/tags', payload),
  update: (id, payload) => adminHttp.put(`/admin/tags/${id}`, payload),
  delete: (id) => adminHttp.delete(`/admin/tags/${id}`),
};

export const apiAdminComments = {
  list: (params = {}) => adminHttp.get('/admin/comments', { params }),
  delete: (id) => adminHttp.delete(`/admin/comments/${id}`),
  updateStatus: (id, status) => adminHttp.put(`/admin/comments/${id}/status`, { status }),
};

export const apiAdminUsers = {
  list: (params = {}) => adminHttp.get('/admin/users', { params }),
  delete: (id) => adminHttp.delete(`/admin/users/${id}`),
  updateStatus: (id, status) => adminHttp.put(`/admin/users/${id}/status`, { status }),
  updateRole: (id, role) => adminHttp.put(`/admin/users/${id}/role`, { role }),
};

