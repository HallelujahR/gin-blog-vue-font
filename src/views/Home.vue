<template>
  <div class="home-page">
    <div class="layout">
    <div class="main">
      <div id="list" class="list-masonry">
        <div v-for="blog in list" :key="blog.id" class="blog-card" :class="{ 'no-media': !blog.cover_image || blog._imgError }" @click="goDetail(blog.id)" style="cursor:pointer; position:relative;">
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
            <router-link :to="`/blog/${blog.id}`" class="blog-card-title" style="position:relative;z-index:2;">{{ blog.title }}</router-link>
            <div class="blog-card-desc" style="position:relative;z-index:2;">{{ blog.excerpt }}</div>
            <div class="blog-card-stats" style="position:relative;z-index:2;">
              <span class="stat-btn stat-like">点赞 {{ blog.like_count || 0 }}</span>
              <span class="stat-btn stat-view">浏览 {{ blog.view_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
      <div ref="sentinel" style="height:1px;"></div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!hasMore && list.length>0" class="loading">没有更多了</div>
    </div>
      <div class="side">
        <div class="side-content">
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
import { apiPosts, apiMeta } from '../api';
import Sidebar from '../components/Sidebar.vue';
import StatsOverview from '../components/StatsOverview.vue';

const route = useRoute();
const router = useRouter();
const categories = ref([]);
const tags = ref([]);

const pageSize = 6;
const page = ref(1);
const total = ref(null);
const list = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const sentinel = ref(null);
let io;

const fetchMeta = async () => {
  const [catRes, tagRes] = await Promise.all([apiMeta.categories(), apiMeta.tags()]);
  categories.value = catRes.data.categories || [];
  tags.value = tagRes.data.tags || [];
};

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
  await fetchMeta();
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
.layout { display:grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
.main { min-width: 0; }
.side { min-width: 0; }
.side-content { position: sticky; top: calc(var(--nav-height) + 12px); display: flex; flex-direction: column; gap: 16px; }
.filter-panel { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px; }
.filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
.filter-title { width:52px; color:var(--muted); font-size:13px; }
.chip { background:var(--chip); border:1px solid var(--chip-border); color:var(--text); padding:6px 10px; border-radius:16px; font-size:12px; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; }
.chip:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,.15); }
.chip.active { background:#e0e7ff; border-color:#c7d2fe; color:#3730a3; font-weight:700; }
.fade-enter-active,.fade-leave-active { transition: opacity .15s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
.list-masonry { display:flex; flex-direction:column; }
.loading { text-align:center; color:var(--muted); margin: 8px 0 16px; }
.blog-card { background:var(--card); color:var(--text); border:none; border-radius:18px; display:flex; margin-bottom:22px; box-shadow:0 6px 18px rgba(17,24,39,.06); overflow:hidden; transition:box-shadow .2s, transform .2s; }
.blog-card.no-media { flex-direction: column; }
.blog-card:hover { box-shadow:0 16px 32px rgba(17,24,39,.12); transform: translateY(-2px); }
.blog-card-media { width:310px; height:180px; flex-shrink:0; border-radius:14px; overflow:hidden; margin:16px 0 16px 16px; background:#f1f5f9; position: relative; display:flex; align-items:center; justify-content:center; }
.blog-card-img { width:100%; height:100%; object-fit:cover; transition: transform 0.5s ease; border-radius: inherit; }
.blog-card:hover .blog-card-img { transform: scale(1.02); }
.blog-card-main { flex:1; padding:28px 22px 22px 28px; display:flex; flex-direction:column; justify-content:center; }
.blog-card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.blog-card-meta-left { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.blog-meta-chip { background:#f3f6ff; border:1px solid #e4ecff; color:#4f46e5; font-size:12px; padding:4px 10px; border-radius:999px; font-weight:500; }
.blog-card-date { font-size:14px; color:var(--muted); }
.blog-card-title { color:var(--text); font-size:22px; font-weight:700; margin:6px 0 10px 0; display:block; }
.blog-card-desc { color:#b8c6e2; font-size:15px; line-height:1.72; margin-bottom: 12px; }
.blog-card-stats { display:flex; align-items:center; gap:24px; padding-top: 12px; border-top: 1px solid rgba(226, 232, 240, 0.5); }
.stat-btn { display:inline-flex; align-items:center; justify-content:flex-start; gap:6px; padding:0; margin:0; border:none; background:transparent; color:#64748b; font-size:14px; line-height:20px; height:20px; font-weight:400; transition:color 0.2s ease; }
.stat-btn.stat-view { color:#94a3b8; }
.stat-btn:hover { color:#475569; }
.stat-btn.stat-view:hover { color:#94a3b8; }
@media (max-width: 900px) {
  .layout { display:flex; flex-direction: column; gap: 16px; }
  .side { order: -1; }
  .side-content { position: static; }
}
</style>
