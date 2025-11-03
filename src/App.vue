<template>
  <div>
    <!-- 前台导航 - 只在非后台路由时显示 -->
    <nav v-if="!isAdminRoute" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <router-link to="/">博客首页</router-link> |
        <router-link to="/about">关于我</router-link>
      </div>
      <div>
        <router-link to="/admin/login" class="admin-link">后台管理</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<style scoped>
.admin-link {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
}

.admin-link:hover {
  color: var(--text);
}
</style>
