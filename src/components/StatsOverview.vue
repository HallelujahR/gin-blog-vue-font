<template>
  <div class="stats-wrapper">
    <header class="stats-header">
      <div>
        <h3>近30日访问概览</h3>
        <p v-if="stats" class="generated">更新于 {{ formattedTime }}</p>
      </div>
    </header>

    <div v-if="error" class="error-banner">
      <span>获取统计失败：{{ error }} · 正在准备自动重试</span>
    </div>

    <template v-else>
      <div class="stats-grid" v-if="stats">
        <div class="stat-card">
          <span class="label">访问次数</span>
          <span class="value">{{ stats.totalVisits }}</span>
        </div>
        <div class="stat-card">
          <span class="label">独立访客</span>
          <span class="value">{{ stats.uniqueVisitors }}</span>
        </div>
      </div>

      <section class="sub-section" v-if="stats">
        <h4>热门文章</h4>
        <ul class="top-posts">
          <li
            v-for="(post, index) in topPosts"
            :key="post.path"
            class="top-post"
            :style="{ backgroundColor: post.bgColor }"
          >
            <router-link :to="post.route" class="title">{{ post.title }}</router-link>
            <span class="count">{{ post.count }} 次访问</span>
          </li>
          <li v-if="topPosts.length === 0" class="empty">暂无数据</li>
        </ul>
      </section>

      <section class="sub-section" v-if="stats">
        <h4>地区分布</h4>
        <div class="regions">
          <div v-for="region in regions" :key="region.name" class="region-row">
            <div class="region-bar">
              <div class="fill" :style="{ width: region.percentage + '%' }"></div>
            </div>
            <div class="region-info">
              <span class="name">{{ region.display }}</span>
              <span class="meta">{{ region.count }} 次 · {{ region.percentage }}%</span>
            </div>
          </div>
          <p v-if="regions.length === 0" class="empty">暂无地区数据</p>
        </div>
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

const formattedTime = computed(() => {
  if (!stats.value?.generatedAt) return '';
  const d = new Date(stats.value.generatedAt);
  return d.toLocaleString();
});

const topPostColors = ['#EEF2FF', '#DCFCE7', '#FFE4E6', '#E0F2FE', '#F5F3FF'];

const topPosts = computed(() => {
  if (!stats.value) return [];
  return stats.value.topPosts.map((post, index) => {
    const route = normalizeRoute(post.path);
    const fallbackTitle = prettifyPath(route);
    return {
      ...post,
      route,
      title: post.title?.trim() || fallbackTitle,
      bgColor: topPostColors[index % topPostColors.length],
    };
  });
});

const regions = computed(() => {
  if (!stats.value) return [];
  return stats.value.regionDistribution.map((r) => ({
    ...r,
    display: r.name === 'UNKNOWN' ? '未知地区' : r.name,
  }));
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
      totalVisits: data.total_visits || 0,
      uniqueVisitors: data.unique_visitors || 0,
      averageDurationMs: data.avg_duration_ms || 0,
      topPosts: Array.isArray(data.top_posts) ? data.top_posts : [],
      regionDistribution: Array.isArray(data.region_distribution) ? data.region_distribution : [],
      generatedAt: data.generated_at,
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
  background: var(--card);
  color: var(--text);
  border-radius: 16px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
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
  font-size: 18px;
}
.generated {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 12px;
}
.stat-card {
  background: rgba(148, 163, 184, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.value {
  font-size: 20px;
  font-weight: 700;
}
.sub-section {
  margin-top: 20px;
}
.sub-section h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}
.top-posts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.top-post {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.top-post:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}
.title {
  color: var(--text);
  text-decoration: none;
  flex: 1;
  font-size: 14px;
  transition: color 0.15s ease;
}
.title:hover {
  color: #6366f1;
}
.count {
  font-size: 12px;
  color: var(--muted);
}
.regions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.region-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.region-bar {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}
.fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}
.region-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}
.name {
  font-weight: 600;
  color: var(--text);
  text-transform: capitalize;
}
.meta {
  font-variant-numeric: tabular-nums;
}
.loading {
  margin-top: 16px;
  font-size: 13px;
  color: var(--muted);
}
.error-banner {
  background: rgba(248, 113, 113, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  color: #b91c1c;
  font-size: 13px;
}
.empty {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}
</style>

