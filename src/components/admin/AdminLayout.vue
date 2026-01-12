<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-logo">
        <h2>后台管理</h2>
      </div>
      <nav class="admin-nav">
        <router-link to="/admin/posts" class="nav-item">
          <span class="nav-icon">📝</span>
          <span>文章管理</span>
        </router-link>
        <router-link to="/admin/categories" class="nav-item">
          <span class="nav-icon">📁</span>
          <span>分类管理</span>
        </router-link>
        <router-link to="/admin/tags" class="nav-item">
          <span class="nav-icon">🏷️</span>
          <span>标签管理</span>
        </router-link>
        <router-link to="/admin/comments" class="nav-item">
          <span class="nav-icon">💬</span>
          <span>评论管理</span>
        </router-link>
        <router-link to="/admin/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/admin/pages" class="nav-item">
          <span class="nav-icon">📄</span>
          <span>页面管理</span>
        </router-link>
      </nav>
    </aside>
    <main class="admin-main">
      <header class="admin-header">
        <h1>{{ currentTitle }}</h1>
        <div class="header-right">
          <div class="user-status">
            <span class="user-name">{{ user?.username || 'Admin' }}</span>
            <span class="user-role">{{ user?.role === 'admin' ? '管理员' : user?.role || 'Admin' }}</span>
          </div>
          <button @click="handleLogout" class="logout-btn-header">退出</button>
          <router-link to="/" class="back-front-btn">返回前台</router-link>
        </div>
      </header>
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminAuth } from '../../utils/auth.js';
import { apiAdminAuth } from '../../api/admin.js';

const route = useRoute();
const router = useRouter();

const user = computed(() => adminAuth.getUser());
const currentTitle = computed(() => route.meta.title || '后台管理');

const handleLogout = async () => {
  apiAdminAuth.logout();
  adminAuth.clearAuth();
  router.push({ name: 'AdminLogin' });
};

// 组件挂载时添加 class 到 body 和 html
onMounted(() => {
  document.body.classList.add('admin-page');
  document.documentElement.classList.add('admin-page');
});

// 组件卸载时移除 class
onUnmounted(() => {
  document.body.classList.remove('admin-page');
  document.documentElement.classList.remove('admin-page');
});
</script>

<style scoped>
/* 苹果官网风格设计 */
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fbfbfd;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

.admin-sidebar {
  width: 280px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  z-index: 10;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-logo {
  padding: 32px 24px 24px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #ffffff;
  flex-shrink: 0;
  height: 80px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.admin-logo h2 {
  margin: 0;
  font-size: 20px;
  color: #1d1d1f;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.admin-nav {
  flex: 1;
  padding: 16px 16px 0 16px;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.admin-nav::-webkit-scrollbar {
  width: 8px;
}

.admin-nav::-webkit-scrollbar-track {
  background: transparent;
}

.admin-nav::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 4px;
}

.admin-nav::-webkit-scrollbar-thumb:hover {
  background: #86868b;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin: 0;
  border-radius: 12px;
  color: #86868b;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 400;
  background: transparent;
  flex-shrink: 0;
}

.nav-item:hover {
  background: #fbfbfd;
  color: #1d1d1f;
}

.nav-item.router-link-active {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
  font-weight: 400;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fbfbfd;
}

.admin-header {
  padding: 0;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0;
  display: none;
}

.admin-header h1 {
  margin: 0;
  font-size: 20px;
  color: #1d1d1f;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.user-name {
  font-size: 13px;
  font-weight: 400;
  color: #1d1d1f;
  line-height: 1.4;
}

.user-role {
  font-size: 12px;
  color: #86868b;
  margin-top: 2px;
  line-height: 1.4;
}

.logout-btn-header {
  background: transparent;
  color: #ff3b30;
  border: 1px solid #ff3b30;
  border-radius: 980px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout-btn-header:hover {
  background: #ff3b30;
  color: #ffffff;
  transform: translateY(-1px);
}

.back-front-btn {
  padding: 6px 16px;
  background: #0071e3;
  color: #fff;
  text-decoration: none;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-front-btn:hover {
  background: #0077ed;
  transform: translateY(-1px);
}

.admin-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background: #fbfbfd;
  position: relative;
}

.admin-content::-webkit-scrollbar {
  width: 10px;
}

.admin-content::-webkit-scrollbar-track {
  background: transparent;
}

.admin-content::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.admin-content::-webkit-scrollbar-thumb:hover {
  background: #86868b;
}
</style>

<style>
/* 全局样式：确保后台管理页面时 body 和 html 背景色一致 */
body.admin-page,
html.admin-page {
  background: #fbfbfd !important;
  height: 100% !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>


