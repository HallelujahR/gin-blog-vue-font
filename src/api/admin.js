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
  list: (params = {}) => adminHttp.get('/admin/posts', { params }),
  detail: (id) => adminHttp.get(`/admin/posts/${id}`),
  // 创建文章：支持FormData（有文件时）或JSON（无文件时）
  create: (payload, imageFile = null) => {
    if (imageFile) {
      // 有文件时，使用FormData
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', payload.title || '');
      if (payload.excerpt) {
        formData.append('excerpt', payload.excerpt);
      }
      formData.append('content', payload.content || '');
      // 处理数组字段 - 支持多种格式（兼容不同后端）
      if (payload.category_ids && Array.isArray(payload.category_ids) && payload.category_ids.length > 0) {
        // 方式1: 数组格式 category_ids[]
        payload.category_ids.forEach(id => {
          formData.append('category_ids[]', String(id));
        });
        // 方式2: JSON字符串（如果后端需要）
        // formData.append('category_ids', JSON.stringify(payload.category_ids));
      }
      if (payload.tag_ids && Array.isArray(payload.tag_ids) && payload.tag_ids.length > 0) {
        // 方式1: 数组格式 tag_ids[]
        payload.tag_ids.forEach(id => {
          formData.append('tag_ids[]', String(id));
        });
        // 方式2: JSON字符串（如果后端需要）
        // formData.append('tag_ids', JSON.stringify(payload.tag_ids));
      }
      if (payload.status) {
        formData.append('status', payload.status);
      }
      return adminHttp.post('/admin/posts', formData, {
        timeout: 30000,
      });
    } else {
      // 无文件时，使用JSON
      return adminHttp.post('/admin/posts', payload);
    }
  },
  // 更新文章：支持FormData（有文件时）或JSON（无文件时）
  update: (id, payload, imageFile = null) => {
    if (imageFile) {
      // 有文件时，使用FormData
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', payload.title || '');
      if (payload.excerpt) {
        formData.append('excerpt', payload.excerpt);
      }
      formData.append('content', payload.content || '');
      // 处理数组字段 - 支持多种格式（兼容不同后端）
      if (payload.category_ids && Array.isArray(payload.category_ids) && payload.category_ids.length > 0) {
        // 方式1: 数组格式 category_ids[]
        payload.category_ids.forEach(catId => {
          formData.append('category_ids[]', String(catId));
        });
        // 方式2: JSON字符串（如果后端需要）
        // formData.append('category_ids', JSON.stringify(payload.category_ids));
      }
      if (payload.tag_ids && Array.isArray(payload.tag_ids) && payload.tag_ids.length > 0) {
        // 方式1: 数组格式 tag_ids[]
        payload.tag_ids.forEach(tagId => {
          formData.append('tag_ids[]', String(tagId));
        });
        // 方式2: JSON字符串（如果后端需要）
        // formData.append('tag_ids', JSON.stringify(payload.tag_ids));
      }
      if (payload.status) {
        formData.append('status', payload.status);
      }
      return adminHttp.put(`/admin/posts/${id}`, formData, {
        timeout: 30000,
      });
    } else {
      // 无文件时，使用JSON
      return adminHttp.put(`/admin/posts/${id}`, payload);
    }
  },
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

// 页面管理API
export const apiAdminPages = {
  list: () => adminHttp.get('/admin/pages'),
  detail: (id) => adminHttp.get(`/admin/pages/${id}`),
  create: (payload) => adminHttp.post('/admin/pages', payload),
  update: (id, payload) => adminHttp.put(`/admin/pages/${id}`, payload),
  delete: (id) => adminHttp.delete(`/admin/pages/${id}`),
};

// 图片上传API
export const apiAdminUpload = {
  // 上传单张图片，返回图片URL
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    // 使用FormData时，不设置Content-Type，让axios自动设置（包括boundary）
    return adminHttp.post('/admin/upload/image', formData, {
      timeout: 30000, // 上传可能需要更长时间
    });
  },
};

