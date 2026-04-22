<template>
  <div class="home-page">
    <div class="layout">
      <div class="main">
        <div id="list" class="list-masonry">
          <div v-for="blog in list" :key="blog.id" class="blog-card" :class="{ 'no-media': !blog.cover_image || blog._imgError }" @click="goDetail(blog.id)">
            <div
              v-if="blog.cover_image && !blog._imgError"
              class="blog-card-media"
            >
              <img
                :src="blog.cover_image"
                class="blog-card-img"
                alt="cover"
                loading="lazy"
                @error="blog._imgError = true"
              />
            </div>
            <div class="blog-card-main">
              <div class="blog-card-meta">
                <div class="blog-card-meta-left">
                  <span v-for="cat in (blog.categories || [])" :key="cat.id" class="blog-meta-chip">{{ cat.name }}</span>
                  <span v-for="t in (blog.tags || [])" :key="t.id" class="blog-meta-chip">#{{ t.name }}</span>
                </div>
                <span class="blog-card-date">{{ formatDate(blog.published_at || blog.created_at) }}</span>
              </div>
              <router-link :to="`/blog/${blog.id}`" class="blog-card-title">{{ blog.title }}</router-link>
              <div class="blog-card-desc">{{ blog.excerpt }}</div>
              <div class="blog-card-stats">
                <span class="stat-btn stat-like">点赞 {{ blog.like_count || 0 }}</span>
                <span class="stat-btn stat-view">浏览 {{ blog.view_count || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div ref="sentinel" class="list-sentinel"></div>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="!hasMore && list.length>0" class="loading">没有更多了</div>
      </div>
      <div class="side">
        <div class="side-content">
          <div class="author-card">
            <div class="author-avatar">
              <img :src="headerImg" alt="Author" />
            </div>
            <div class="author-name">RvierLog</div>
            <div class="author-role">Developer / Designer / Backend Engineer</div>
            <p class="author-bio">
              Hi，我是 Ruiwen，来自延边。相信代码让人理性，生活让人温柔。
            </p>
            <div class="author-tags">
              <span class="author-tag">摄影</span>
              <span class="author-tag">旅游</span>
              <span class="author-tag">PlayStation</span>
              <span class="author-tag">Steam</span>
              <span class="author-tag">Coding</span>
              <span class="author-tag">电影</span>
            </div>
            <router-link to="/about" class="author-link">更多关于我</router-link>
          </div>
          <StatsOverview />
          <Sidebar />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiPosts } from '../api';
import Sidebar from '../components/Sidebar.vue';
import StatsOverview from '../components/StatsOverview.vue';
import headerImg from '../assets/header.png';

const route = useRoute();
const router = useRouter();

const pageSize = 6;
const page = ref(1);
const total = ref(null);
const list = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const sentinel = ref(null);
let io;

async function fetchPage(p = 1) {
  loading.value = true;
  const params = {
    page: p,
    size: pageSize,
    q: route.query.q || undefined,
    category: route.query.category,
    tag: route.query.tag,
    sort: route.query.sort || 'desc',
  };
  const res = await apiPosts.list(params);
  const raw = res.data.posts || res.data || [];
  // 将后端返回的 category_names/category_ids 和 tag_names/tag_ids 转换为对象数组
  const rows = raw.map(r => {
    // 处理分类：将 category_names 和 category_ids 组合成对象数组
    const categories = [];
    if (r.category_names && Array.isArray(r.category_names)) {
      const ids = (r.category_ids && Array.isArray(r.category_ids)) ? r.category_ids : [];
      for (let i = 0; i < r.category_names.length; i++) {
        if (r.category_names[i]) { // 确保名称不为空
          categories.push({
            id: ids[i] || (i + 1),
            name: r.category_names[i]
          });
        }
      }
    }
    
    // 处理标签：将 tag_names 和 tag_ids 组合成对象数组
    const tags = [];
    if (r.tag_names && Array.isArray(r.tag_names)) {
      const ids = (r.tag_ids && Array.isArray(r.tag_ids)) ? r.tag_ids : [];
      for (let i = 0; i < r.tag_names.length; i++) {
        if (r.tag_names[i]) { // 确保名称不为空
          tags.push({
            id: ids[i] || (i + 1),
            name: r.tag_names[i]
          });
        }
      }
    }
    
    return {
      ...r,
      categories: categories,
      tags: tags,
      _imgError: false
    };
  });
  const t = res.data.total;
  total.value = typeof t === 'number' ? t : total.value;
  if (p === 1) list.value = rows; else list.value = list.value.concat(rows);
  if ((typeof t === 'number' && list.value.length >= t) || rows.length < pageSize) hasMore.value = false; else hasMore.value = true;
  loading.value = false;
}

function initObserver() {
  if (io) io.disconnect();
  io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && hasMore.value && !loading.value) {
        page.value += 1;
        fetchPage(page.value);
      }
    });
  }, { rootMargin: '200px' });
  if (sentinel.value) io.observe(sentinel.value);
}

function reload() {
  page.value = 1; total.value = null; hasMore.value = true; list.value = [];
  fetchPage(1);
}

function goDetail(id) { router.push(`/blog/${id}`); }

watch(() => [route.query.category, route.query.tag, route.query.q, route.query.sort], () => {
  reload();
});

onMounted(async () => {
  await fetchPage(1);
  initObserver();
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' });
}
</script>
<style scoped>
.home-page { position: relative; }
.home-page::before {
  content: "";
  position: absolute;
  inset: 8px 0 auto;
  height: 140px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0)),
    repeating-linear-gradient(180deg, rgba(224, 224, 220, 0.42), rgba(224, 224, 220, 0.42) 1px, transparent 1px, transparent 36px);
  opacity: 0.5;
  pointer-events: none;
}
.layout { display:grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 24px; align-items: start; }
.main { min-width: 0; position: relative; z-index: 1; }
.side { min-width: 0; }
.side-content { position: sticky; top: calc(var(--nav-height) + 12px); display: flex; flex-direction: column; gap: 16px; }
.author-card { background-color: rgba(253, 253, 253, 0.58); background-image: var(--paper-glow), var(--paper-texture); border: 1px solid rgba(122, 122, 122, 0.08); border-radius: var(--radius-md); padding: 24px 20px; display: flex; flex-direction: column; align-items: center; box-shadow: none; gap: 8px; position: relative; overflow: hidden; }
.author-card::after {
  content: "";
  position: absolute;
  inset: auto 16px 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(122, 122, 122, 0.08), transparent);
}
.author-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(122, 122, 122, 0.12); }
.author-avatar img { width: 100%; height: 100%; object-fit: cover; }
.author-name { color: var(--text-head); font-family: var(--font-body); font-size: 18px; font-weight: 600; }
.author-role { color: var(--muted); font-size: 13px; font-weight: 500; text-align: center; }
.author-bio { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.8; text-align: center; max-width: 18em; }
.author-tags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 2px; }
.author-tag { background: transparent; border: 1px solid var(--chip-border); color: var(--primary-1); padding: 3px 8px; border-radius: var(--radius-sm); font-size: 12px; }
.author-link { margin-top: 4px; color: var(--primary-1); background: transparent; border: 1px solid var(--primary-1); border-radius: var(--radius-sm); padding: 6px 14px; font-weight: 600; font-size: 13px; text-decoration: none; transition: background .18s, color .18s; }
.author-link:hover { background: var(--primary-1); color: #fff; }
.filter-panel { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-bottom:12px; }
.filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
.filter-title { width:52px; color:var(--muted); font-size:13px; }
.chip { background:var(--chip); border:1px solid var(--chip-border); color:var(--muted); padding:4px 10px; border-radius:var(--radius-sm); font-size:12px; cursor:pointer; transition:border-color .18s, color .18s; }
.chip:hover { border-color: var(--primary-1); color: var(--primary-1); }
.chip.active { background:var(--chip-active-bg); border-color:var(--primary-1); color:var(--primary-1); font-weight:600; }
.fade-enter-active,.fade-leave-active { transition: opacity .15s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
.list-masonry { display:flex; flex-direction:column; position: relative; z-index: 1; }
.list-sentinel { height: 1px; }
.loading { text-align:center; color:var(--muted); margin: 8px 0 16px; }
.blog-card { background-color:rgba(253, 253, 253, 0.44); background-image:var(--paper-glow), var(--paper-texture); color:var(--text); border:1px solid rgba(122, 122, 122, 0.07); border-radius:var(--radius-lg); display:flex; margin-bottom:24px; box-shadow:none; overflow:hidden; transition:border-color .2s, background-color .2s, transform .2s; cursor:pointer; position:relative; }
.blog-card.no-media { flex-direction: column; }
.blog-card:hover { border-color:rgba(107, 143, 113, 0.18); background-color:rgba(253, 253, 253, 0.62); transform: translateY(-1px); }
.blog-card::before {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(107, 143, 113, 0.16), transparent);
}
.blog-card-media { width:310px; aspect-ratio: 16 / 9; flex-shrink:0; border-radius:var(--radius-sm); overflow:hidden; margin:12px 0 12px 12px; background:rgba(247, 247, 244, 0.72); position: relative; display:flex; align-items:center; justify-content:center; }
.blog-card-img { width:100%; height:100%; object-fit:cover; transition: opacity 0.3s ease; border-radius: inherit; }
.blog-card:hover .blog-card-img { opacity: 0.92; }
.blog-card-main { flex:1; padding:24px 24px 20px 24px; display:flex; flex-direction:column; justify-content:center; }
.blog-card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.blog-card-meta-left { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
.blog-meta-chip {
  background: transparent;
  border: 1px solid rgba(107, 143, 113, 0.18);
  color: var(--muted);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}
.blog-card-date { font-size:13px; color:var(--muted); }
.blog-card-title { color:var(--text-head); font-family:var(--font-body); font-size:20px; font-weight:600; margin:8px 0 10px 0; display:block; line-height: 1.35; text-wrap: balance; }
.blog-card-desc { color:var(--muted); font-size:14px; line-height:1.8; margin-bottom: 12px; }
.blog-card-stats { display:flex; align-items:center; gap:24px; padding-top: 10px; border-top: 1px solid rgba(122, 122, 122, 0.07); }
.stat-btn { display:inline-flex; align-items:center; justify-content:flex-start; gap:6px; padding:0; margin:0; border:none; background:transparent; color:var(--muted); font-size:13px; line-height:20px; height:20px; font-weight:400; transition:color 0.2s ease; }
.stat-btn.stat-view { color:var(--primary-1); }
.stat-btn:hover { color:var(--text); }
.stat-btn.stat-view:hover { color:var(--primary-2); }
@media (max-width: 900px) {
  .layout { display:flex; flex-direction: column; gap: 16px; }
  .side { order: -1; }
  .side-content { position: static; }
  .home-page::before { inset: 0 0 auto; height: 96px; }
}

@media (max-width: 640px) {
  .layout {
    gap: 14px;
  }
  .side-content {
    gap: 12px;
  }
  .author-card {
    padding: 18px 16px;
  }
  .blog-card-meta {
    align-items: flex-start;
    gap: 8px;
    flex-direction: column;
  }
  .blog-card {
    flex-direction: column;
  }
  .blog-card-media {
    width: calc(100% - 24px);
    aspect-ratio: 16 / 9;
    height: auto;
    margin: 12px 12px 8px;
  }
  .blog-card-main {
    padding: 16px 16px 16px;
  }
  .blog-card-title {
    font-size: 17px;
    line-height: 1.4;
    margin-bottom: 8px;
  }
  .blog-card-desc {
    font-size: 13px;
    margin-bottom: 10px;
  }
  .blog-card-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
