<template>
  <div>
    <!-- 前台导航 - 只在非后台路由时显示 -->
    <nav v-if="!isAdminRoute" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <router-link to="/">博客首页</router-link> |
        <router-link to="/about">关于我</router-link>
      </div>
    </nav>
    <router-view />
    <!-- 全局提示 -->
    <ToastContainer />
    <ConfirmContainer />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ToastContainer from './components/admin/ToastContainer.vue';
import ConfirmContainer from './components/admin/ConfirmContainer.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<style scoped>
</style>
