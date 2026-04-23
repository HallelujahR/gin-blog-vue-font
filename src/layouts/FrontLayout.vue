<template>
  <div class="front-layout">
    <nav class="site-nav">
      <div class="site-nav-inner">
        <div class="site-links">
          <router-link to="/">博客首页</router-link>
          <router-link to="/moments">碎碎念</router-link>
          <router-link to="/tools">工具栏</router-link>
          <router-link to="/about">关于我</router-link>
          <router-link to="/guestbook">留言板</router-link>
        </div>
        <div class="site-search-wrap">
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

    <main class="site-content with-nav">
      <router-view />
    </main>

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
        <a href="https://icp.gov.moe/?keyword=20260512" target="_blank">萌ICP备20260512号</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navQ = ref(route.query.q || '');

function goSearch() {
  router.push({ name: 'Home', query: { ...route.query, q: navQ.value || undefined } });
}

watch(() => route.query.q, (value) => {
  navQ.value = value || '';
});
</script>

<style scoped>
:global(:root) { --nav-height: 48px; }
:global(:root) { --nav-mobile-offset: 112px; }

.front-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  min-height: var(--nav-height);
  background: rgba(253, 253, 253, 0.84);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(122, 122, 122, 0.08);
  z-index: 1000;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.42);
}

.site-nav-inner {
  max-width: 960px;
  margin: 0 auto;
  min-height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 20px;
}

.site-links {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
  white-space: nowrap;
  writing-mode: horizontal-tb;
}

.site-search-wrap {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.site-links a {
  display: inline-flex;
  align-items: center;
  height: var(--nav-height);
  padding: 0 12px;
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: color 0.2s ease;
  background: transparent !important;
  letter-spacing: 0.02em;
}

.site-links a::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  height: 1px;
  background: var(--primary-1);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s ease;
}

.site-links a:hover {
  color: var(--primary-1);
}

.site-links a:hover::after,
.site-links a.router-link-active::after {
  transform: scaleX(1);
}

.site-links a.router-link-active {
  color: var(--primary-1);
}

.nav-search {
  width: 220px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid rgba(122, 122, 122, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text);
  border-radius: var(--radius-sm);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.nav-search:focus {
  outline: none;
  border-color: var(--primary-1);
  box-shadow: 0 0 0 1px rgba(107, 143, 113, 0.16);
  background: rgba(255, 255, 255, 0.94);
}

.site-content {
  flex: 1;
}

.site-content.with-nav {
  padding-top: calc(var(--nav-height) + 18px);
}

.site-footer {
  padding: 18px 0 18px;
  border-top: 1px solid rgba(122, 122, 122, 0.08);
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
}

@media (max-width: 720px) {
  .site-nav-inner {
    padding: 10px 12px;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    min-height: unset;
  }

  .site-links {
    width: 100%;
    overflow-x: auto;
  }

  .site-search-wrap {
    width: 100%;
  }

  .nav-search {
    width: 100%;
  }

  .site-content.with-nav {
    padding-top: var(--nav-mobile-offset);
  }
}

@media (max-width: 480px) {
  :global(:root) { --nav-mobile-offset: 120px; }

  .site-links a {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
