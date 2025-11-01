import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import BlogDetail from '../views/BlogDetail.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/blog/:id', name: 'BlogDetail', component: BlogDetail, props: true }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
