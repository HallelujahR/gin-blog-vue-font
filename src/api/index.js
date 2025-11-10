import axios from 'axios';
import { adminAuth } from '../utils/auth.js';

const http = axios.create({
  baseURL: '/api',
  timeout: 7000,
});

// 请求拦截器：根据路径自动添加相应的token
http.interceptors.request.use(
  (config) => {
    // 如果是后台管理接口，使用 admin_token
    if (config.url && config.url.includes('/admin/')) {
      const adminToken = adminAuth.getToken();
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // 前台接口，如果有前台token就用前台token（预留）
      const frontToken = localStorage.getItem('front_token');
      if (frontToken) {
        config.headers.Authorization = `Bearer ${frontToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理401错误
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果是后台接口401，清除后台认证
      if (error.config && error.config.url && error.config.url.includes('/admin/')) {
        adminAuth.clearAuth();
        // 如果当前在后台路由，重定向到登录页
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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
