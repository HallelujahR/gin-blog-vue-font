import AdminLayout from '../components/admin/AdminLayout.vue';
import { adminAuth } from '../utils/auth.js';

// 后台管理路由
export const adminRoutes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/Login.vue'),
    meta: { requiresAuth: false, isAdmin: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/posts',
    meta: { requiresAuth: true, isAdmin: true },
    children: [
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('../views/admin/Posts.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '文章管理' }
      },
      {
        path: 'posts/create',
        name: 'AdminPostCreate',
        component: () => import('../views/admin/PostEdit.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '创建文章' }
      },
      {
        path: 'posts/edit/:id',
        name: 'AdminPostEdit',
        component: () => import('../views/admin/PostEdit.vue'),
        props: true,
        meta: { requiresAuth: true, isAdmin: true, title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/admin/Categories.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'AdminTags',
        component: () => import('../views/admin/Tags.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '标签管理' }
      },
      {
        path: 'comments',
        name: 'AdminComments',
        component: () => import('../views/admin/Comments.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '评论管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '用户管理' }
      },
    ]
  },
];

// 路由守卫函数
export const adminBeforeEach = (to, from, next) => {
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 检查是否已登录
    if (!adminAuth.isAuthenticated()) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
      return;
    }
    
    // 检查是否为管理员
    if (!adminAuth.isAdmin()) {
      next({ name: 'AdminLogin' });
      return;
    }
  } else if (to.name === 'AdminLogin' && adminAuth.isAuthenticated() && adminAuth.isAdmin()) {
    // 如果已经登录，访问登录页时重定向到首页
    next({ name: 'AdminPosts' });
    return;
  }
  
  next();
};

