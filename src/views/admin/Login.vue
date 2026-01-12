<template>
  <div class="admin-login">
    <div class="login-card">
      <h2>后台管理登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" required placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" required placeholder="请输入密码" />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <div class="login-footer">
        <router-link to="/">返回前台</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiAdminAuth } from '../../api/admin.js';
import { adminAuth } from '../../utils/auth.js';

const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await apiAdminAuth.login(username.value, password.value);
    const { token, user } = response.data;
    
    if (!token || !user) {
      error.value = '登录失败，请检查用户名和密码';
      loading.value = false;
      return;
    }

    // 检查用户角色
    if (user.role !== 'admin') {
      error.value = '您没有管理员权限';
      loading.value = false;
      return;
    }

    // 保存token和用户信息
    adminAuth.setToken(token, user);

    // 重定向到目标页面或默认页面
    const redirect = route.query.redirect || '/admin/posts';
    router.push(redirect);
  } catch (err) {
    error.value = err.response?.data?.error || err.message || '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f7;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.login-card h2 {
  margin: 0 0 36px;
  text-align: center;
  color: #1d1d1f;
  font-size: 28px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.error-message {
  margin-bottom: 16px;
  padding: 14px 18px;
  background: #FFEBEE;
  border: none;
  border-radius: 8px;
  color: #D32F2F;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
}

.login-btn {
  width: 100%;
  padding: 12px;
  height: 44px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover:not(:disabled) {
  background: #0051D5;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #94a3b8;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.login-footer a {
  color: #007AFF;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.login-footer a:hover {
  color: #0051D5;
}
</style>

