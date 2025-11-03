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
import { computed } from 'vue';
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
</script>

<style scoped>
/* 全新明亮设计 - 整体明亮，背景明亮，边框浅色 */
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  background: #f8fafc;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.admin-sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.02);
}

.admin-logo {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.admin-logo h2 {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.admin-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  background: #ffffff;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 6px;
  border-radius: 10px;
  color: #64748b;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
}

.nav-item:hover {
  background: #f8fafc;
  color: #475569;
  transform: translateX(4px);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.admin-header {
  padding: 20px 24px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.admin-header h1 {
  margin: 0;
  font-size: 26px;
  color: #1e293b;
  font-weight: 700;
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
  padding-right: 20px;
  border-right: 1px solid #f1f5f9;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.user-role {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.logout-btn-header {
  padding: 10px 20px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-btn-header:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

.back-front-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.back-front-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.admin-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background: #f8fafc;
}
</style>

