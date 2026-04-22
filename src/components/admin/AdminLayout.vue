<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-brandbar">
        <div class="admin-platform-mark">RB</div>
        <div class="admin-sidebar-titlebox">
          <strong>River Blog</strong>
          <span>Admin System</span>
        </div>
      </div>

      <nav class="admin-nav">
        <section v-for="group in navGroups" :key="group.label" class="admin-nav-group">
          <p class="admin-nav-group-title">{{ group.label }}</p>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="admin-nav-link"
          >
            <span class="admin-nav-text">{{ item.label }}</span>
          </router-link>
        </section>
      </nav>
    </aside>

    <section class="admin-workspace">
      <header class="admin-topbar">
        <div class="admin-topbar-copy">欢迎使用博客后台管理系统</div>
        <div class="admin-topbar-right">
          <div class="admin-userbox">
            <span class="admin-userbox-label">用户:</span>
            <strong>{{ user?.username || 'Admin' }}</strong>
            <span class="admin-userbox-divider">|</span>
            <span class="admin-userbox-label">角色:</span>
            <small>{{ user?.role === 'admin' ? '管理员' : user?.role || 'Admin' }}</small>
          </div>
          <div class="admin-topbar-actions">
            <router-link to="/" class="admin-topbar-btn">查看前台</router-link>
            <button @click="handleLogout" class="admin-topbar-btn admin-topbar-btn-danger">退出登录</button>
          </div>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminAuth } from '../../utils/auth.js';
import { apiAdminAuth } from '../../api/admin.js';

const router = useRouter();

const user = computed(() => adminAuth.getUser());
const navGroups = [
  {
    label: '内容管理',
    items: [
      { to: '/admin/posts', label: '文章管理' },
      { to: '/admin/pages', label: '页面管理' },
      { to: '/admin/comments', label: '评论管理' },
    ],
  },
  {
    label: '结构管理',
    items: [
      { to: '/admin/categories', label: '分类管理' },
      { to: '/admin/tags', label: '标签管理' },
    ],
  },
  {
    label: '系统管理',
    items: [
      { to: '/admin/users', label: '用户管理' },
    ],
  },
];

const handleLogout = async () => {
  apiAdminAuth.logout();
  adminAuth.clearAuth();
  router.push({ name: 'AdminLogin' });
};

onMounted(() => {
  document.body.classList.add('admin-page');
  document.documentElement.classList.add('admin-page');
});

onUnmounted(() => {
  document.body.classList.remove('admin-page');
  document.documentElement.classList.remove('admin-page');
});
</script>

<style scoped>
.admin-shell {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: var(--admin-sidebar-width) minmax(0, 1fr);
  background: var(--admin-bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--admin-line);
  background: linear-gradient(180deg, #f5f1e8 0%, #f1ece2 100%);
}

.admin-sidebar-brandbar {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid var(--admin-line);
  background: rgba(255, 255, 255, 0.5);
  flex: 0 0 64px;
}

.admin-platform-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--admin-line-strong);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-accent);
  font-size: 12px;
  font-weight: 700;
}

.admin-sidebar-titlebox {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-sidebar-titlebox strong {
  font-size: 14px;
  color: var(--admin-text);
}

.admin-sidebar-titlebox span,
.admin-nav-group-title,
.admin-topbar-copy,
.admin-userbox-label,
.admin-userbox small {
  color: var(--admin-muted);
  font-size: 12px;
}

.admin-nav {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 10px;
  display: grid;
  gap: 14px;
  align-content: start;
}

.admin-nav-group {
  display: grid;
  gap: 4px;
}

.admin-nav-link {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--admin-text);
  text-decoration: none;
  background: transparent;
  transition: 160ms ease;
  font-size: 14px;
  font-weight: 500;
}

.admin-nav-link:hover,
.admin-nav-link.router-link-active {
  border-color: rgba(88, 82, 72, 0.08);
  background: rgba(255, 255, 255, 0.84);
  color: var(--admin-accent);
  box-shadow: 0 1px 2px rgba(26, 23, 18, 0.03);
}

.admin-workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: linear-gradient(180deg, #f4f1ea 0%, #f2eee6 100%);
}

.admin-topbar {
  height: 64px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--admin-line);
  background: rgba(251, 250, 246, 0.92);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.admin-topbar-right {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.admin-userbox {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(88, 82, 72, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  box-sizing: border-box;
  line-height: 1;
}

.admin-userbox strong {
  font-size: 14px;
  color: var(--admin-text);
  line-height: 1;
}

.admin-userbox-divider {
  color: var(--admin-faint);
  font-size: 12px;
  line-height: 1;
}

.admin-userbox-label,
.admin-userbox small {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.admin-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-topbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(88, 82, 72, 0.08);
  background: rgba(255, 255, 255, 0.82);
  color: var(--admin-text);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  cursor: pointer;
  box-sizing: border-box;
  white-space: nowrap;
  vertical-align: middle;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  font-family: inherit;
}

.admin-topbar-btn:hover {
  border-color: rgba(88, 82, 72, 0.14);
  background: #fff;
}

.admin-topbar-btn-danger {
  color: var(--admin-danger);
}

.admin-topbar-btn-danger:hover {
  border-color: rgba(182, 93, 93, 0.2);
  background: rgba(182, 93, 93, 0.06);
}

.admin-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0)),
    #f4f1ea;
}

@media (max-width: 1080px) {
  .admin-shell {
    position: static;
    min-height: 100vh;
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--admin-line);
  }

  .admin-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .admin-topbar {
    height: auto;
    padding: 14px;
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-topbar-right {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .admin-topbar-actions {
    flex-wrap: wrap;
  }

  .admin-nav {
    grid-template-columns: 1fr;
  }

  .admin-content {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
