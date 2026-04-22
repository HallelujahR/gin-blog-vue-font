<template>
  <div class="admin-login-shell">
    <aside class="admin-login-aside">
      <p class="admin-page-subtitle">Admin Access</p>
      <h1 class="admin-login-title">后台管理入口</h1>
      <p class="admin-login-copy">
        登录后可以管理文章、评论、页面、分类、标签与用户权限。
      </p>
    </aside>

    <section class="admin-login-panel">
      <div class="admin-page-head">
        <div>
          <p class="admin-page-subtitle">管理员登录</p>
          <h2 class="admin-page-title">进入后台工作台</h2>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="admin-stack">
        <div class="admin-fieldset">
          <label>用户名</label>
          <input v-model="username" type="text" required placeholder="请输入用户名" class="admin-input" />
        </div>
        <div class="admin-fieldset">
          <label>密码</label>
          <input v-model="password" type="password" required placeholder="请输入密码" class="admin-input" />
        </div>
        <div v-if="error" class="admin-error">{{ error }}</div>
        <button type="submit" :disabled="loading" class="admin-btn">
          {{ loading ? '登录中...' : '登录后台' }}
        </button>
        <router-link to="/" class="admin-btn admin-btn-ghost login-back-link">返回前台</router-link>
      </form>
    </section>
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

    if (user.role !== 'admin') {
      error.value = '您没有管理员权限';
      loading.value = false;
      return;
    }

    adminAuth.setToken(token, user);

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
.login-back-link {
  width: 100%;
}
</style>
