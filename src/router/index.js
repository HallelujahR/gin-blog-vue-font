import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes, adminBeforeEach } from './admin.js';

// 前台路由
const frontRoutes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/tools', name: 'Tools', component: () => import('../views/Tools.vue') },
  { path: '/about', name: 'About', component: () => import('../views/About.vue') },
  { path: '/blog/:id', name: 'BlogDetail', component: () => import('../views/BlogDetail.vue'), props: true }
];

// 合并前后台路由
const routes = [
  ...frontRoutes,
  ...adminRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 添加后台管理路由守卫
router.beforeEach((to, from, next) => {
  // 如果是后台路由，使用后台守卫
  if (to.path.startsWith('/admin')) {
    adminBeforeEach(to, from, next);
  } else {
    next();
  }
});

export default router;
