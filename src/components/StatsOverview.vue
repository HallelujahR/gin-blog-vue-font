<template>
  <div class="stats-wrapper">
    <header class="stats-header">
      <div>
        <h3>热门文章</h3>
      </div>
    </header>

    <div v-if="error" class="error-banner">
      <span>获取统计失败：{{ error }} · 正在准备自动重试</span>
    </div>

    <template v-else>
      <section class="sub-section" v-if="stats">
        <ul class="top-posts">
          <li
            v-for="(post, index) in topPosts"
            :key="post.path"
            class="top-post"
          >
            <span class="top-post-rank">{{ String(index + 1).padStart(2, '0') }}</span>
            <router-link :to="post.route" class="title">{{ post.title }}</router-link>
          </li>
          <li v-if="topPosts.length === 0" class="empty">暂无数据</li>
        </ul>
      </section>
    </template>

    <div v-if="loading && !stats" class="loading">
      加载统计数据...
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { apiStats } from '../api';

const loading = ref(false);
const stats = ref(null);
const error = ref('');

const topPosts = computed(() => {
  if (!stats.value) return [];
  return stats.value.topPosts.map((post) => {
    const route = normalizeRoute(post.path);
    const fallbackTitle = prettifyPath(route);
    return {
      ...post,
      route,
      title: post.title?.trim() || fallbackTitle,
    };
  });
});

let retryTimer = null;

async function refresh() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  loading.value = true;
  error.value = '';
  try {
    const res = await apiStats.summary();
    const data = res.data || {};
    stats.value = {
      topPosts: Array.isArray(data.top_posts) ? data.top_posts : [],
    };
  } catch (err) {
    error.value = err?.message || '请求失败';
    retryTimer = setTimeout(() => {
      refresh();
    }, 8000);
  } finally {
    loading.value = false;
  }
}

function normalizeRoute(path = '') {
  if (!path) return '/';
  if (path.startsWith('/api/posts/')) {
    return `/blog/${path.replace('/api/posts/', '')}`;
  }
  if (path.startsWith('/posts/')) {
    return `/blog/${path.replace('/posts/', '')}`;
  }
  return path;
}

function prettifyPath(path) {
  if (!path || path === '/') return '博客首页';
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'blog' && parts[1]) {
    return `文章 #${parts[1]}`;
  }
  if (parts[0] === 'posts' && parts[1]) {
    return `文章 #${parts[1]}`;
  }
  return path;
}

onMounted(() => {
  refresh();
});

onUnmounted(() => {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }
});
</script>
<style scoped>
.stats-wrapper {
  background-color: rgba(253, 253, 253, 0.38);
  background-image: var(--paper-glow), var(--paper-texture);
  color: var(--text);
  border: 1px solid rgba(122, 122, 122, 0.07);
  border-radius: var(--radius-md);
  box-shadow: none;
  padding: 20px 22px 24px;
  width: 100%;
  box-sizing: border-box;
}
.stats-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}
.stats-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-head);
  font-family: var(--font-body);
}
.sub-section {
  margin-top: 16px;
}
.top-posts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.top-post {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(122, 122, 122, 0.06);
  background: rgba(255, 255, 255, 0.2);
  transition: border-color .18s, background .18s;
}
.top-post:hover {
  border-color: rgba(107, 143, 113, 0.18);
  background: rgba(255, 255, 255, 0.34);
}
.top-post-rank {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--faint);
  min-width: 2ch;
}
.title {
  color: var(--text);
  text-decoration: none;
  flex: 1;
  font-size: 14px;
  transition: color 0.15s ease;
}
.title:hover {
  color: var(--primary-1);
}
.loading {
  margin-top: 16px;
  font-size: 13px;
  color: var(--muted);
}
.error-banner {
  background: rgba(196, 92, 92, 0.06);
  border: 1px solid rgba(196, 92, 92, 0.2);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  color: #C45C5C;
  font-size: 13px;
}
.empty {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

@media (max-width: 640px) {
  .stats-wrapper {
    padding: 16px 16px 18px;
  }
  .top-post {
    align-items: flex-start;
    gap: 10px;
  }
  .title {
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
