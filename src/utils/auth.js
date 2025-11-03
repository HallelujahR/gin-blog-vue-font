// 认证工具模块
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

// 后台管理认证
export const adminAuth = {
  // 保存token和用户信息
  setToken(token, user) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },

  // 获取token
  getToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  // 获取用户信息
  getUser() {
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },

  // 检查是否已登录
  isAuthenticated() {
    return !!this.getToken();
  },

  // 检查是否为管理员
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },
};

// 前台认证（预留，当前不支持）
export const frontAuth = {
  setToken(token, user) {
    localStorage.setItem('front_token', token);
    localStorage.setItem('front_user', JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem('front_token');
  },

  getUser() {
    const userStr = localStorage.getItem('front_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearAuth() {
    localStorage.removeItem('front_token');
    localStorage.removeItem('front_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

