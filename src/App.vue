<template>
  <div class="app-shell">
    <!-- 前台导航 - 只在非后台路由时显示 -->
    <nav v-if="!isAdminRoute" class="site-nav">
      <div class="site-nav-inner">
        <div class="site-links">
          <router-link to="/">博客首页</router-link>
          <router-link to="/tools">工具栏</router-link>
          <router-link to="/about">关于我</router-link>
          <input
            v-model="navQ"
            class="nav-search"
            type="text"
            placeholder="搜索文章…"
            @keyup.enter="goSearch"
          />
        </div>
      </div>
    </nav>
    <div :class="['site-content', { 'with-nav': !isAdminRoute }]">
      <router-view />
    </div>
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-item">
          <span class="footer-icon">©</span>
          <span>2020 - 2025 By RvierLog</span>
        </div>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener"
          class="footer-item beian-link"
        >
          <span class="footer-icon">📄</span>
          <span>吉ICP备2025034013号-1</span>
        </a>
        <a
          href="https://icp.gov.moe/?keyword=20250798"
          target="_blank"
          rel="noopener"
          class="footer-item beian-link"
        >
          <span class="footer-icon">😴</span>
          <span>萌ICP备20250798号</span>
        </a>
        <!-- 如需公安备案，可启用下列示例，并替换为真实备案号
        <a
          href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=XXXXXX"
          target="_blank"
          rel="noopener"
          class="footer-item beian-link"
        >
          <span class="footer-icon">🛡</span>
          <span>京公网安备 XXXXXXXXXXXXX 号</span>
        </a>
        -->
      </div>
    </footer>
    <!-- 全局提示 -->
    <ToastContainer />
    <ConfirmContainer />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ToastContainer from './components/admin/ToastContainer.vue';
import ConfirmContainer from './components/admin/ConfirmContainer.vue';

const route = useRoute();
const router = useRouter();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));

const navQ = ref(route.query.q || '');
function goSearch() {
  router.push({ name: 'Home', query: { ...route.query, q: navQ.value || undefined } });
}
</script>

<style scoped>
:global(:root) { --nav-height: 38px; }
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.site-nav { position: fixed; top: 0; left: 0; right: 0; height: var(--nav-height); background: var(--card); border-bottom: 1px solid var(--border); z-index: 1000; }
.site-nav-inner { max-width: 960px; margin: 0 auto; height: 100%; display: flex; align-items: center; justify-content: flex-start; padding: 0 20px; }
.site-links { display: flex; align-items: center; gap: 4px; flex-wrap: nowrap; white-space: nowrap; writing-mode: horizontal-tb; }
.site-links a { display: inline-flex; align-items: center; height: var(--nav-height); padding: 0 10px; color: var(--text); text-decoration: none; font-weight: 500; position: relative; transition: text-shadow 0.2s ease; background: transparent !important; }
.site-links a:hover { text-shadow: 0 0 4px rgba(30,41,59,0.15); background: transparent !important; }
.site-links a.router-link-active { text-shadow: 0 0 6px rgba(30,41,59,0.25); background: transparent !important; }
.nav-search { margin-left: 16px; height: 26px; padding: 0 10px; font-size: 14px; border: 1px solid var(--border); background: #fff; color: var(--text); border-radius: 6px; }
.nav-search:focus { outline: none; border-color: #cbd5e1; }
.site-content {
  flex: 1;
}
.site-content.with-nav {
  padding-top: calc(var(--nav-height) + 10px);
}
.site-footer {
  padding: 12px 0 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
}
.footer-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  justify-content: center;
}
.footer-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  text-decoration: none;
}
.footer-icon {
  font-size: 14px;
}
.beian-link:hover {
  color: var(--text);
  text-decoration: underline;
}
</style>
