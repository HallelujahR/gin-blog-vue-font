<template>
  <div class="layout">
    <div class="main">
      <div class="blog-search-bar">
        <input v-model="search" class="blog-search-input" type="text" placeholder="Search posts..." @keyup.enter="reload" />
        <div class="blog-search-btns">
          <button class="icon-btn" title="按时间排序" @click="toggleSort">
            <span style="color:#c9d3ea;font-size:12px;">{{ sortLabel }}</span>
          </button>
          <button class="icon-btn" title="筛选" @click="showFilter = !showFilter">🔍</button>
        </div>
      </div>

      <transition name="fade">
        <div v-if="showFilter" class="filter-panel">
          <div class="filter-row">
            <span class="filter-title">分类</span>
            <button v-for="c in categories" :key="c.id" class="chip"
              :class="{active: route.query.category === c.slug}"
              @click="applyQuery({ category: route.query.category === c.slug ? undefined : c.slug })">{{ c.name }}</button>
          </div>
          <div class="filter-row">
            <span class="filter-title">标签</span>
            <button v-for="t in tags" :key="t.id" class="chip"
              :class="{active: route.query.tag === t.slug}"
              @click="applyQuery({ tag: route.query.tag === t.slug ? undefined : t.slug })">#{{ t.name }}</button>
          </div>
          <div class="filter-row">
            <button class="chip" @click="clearFilters">清除筛选</button>
          </div>
        </div>
      </transition>

      <div id="list" class="list-masonry">
        <div v-for="blog in list" :key="blog.id" class="blog-card" @click="goDetail(blog.id)" style="cursor:pointer; position:relative;">
          <router-link :to="`/blog/${blog.id}`" style="position:absolute;inset:0;z-index:1;" aria-label="open" />
          <img :src="blog.cover_image" class="blog-card-img" alt="cover" v-if="blog.cover_image"/>
          <div class="blog-card-main">
            <div class="blog-card-meta">
              <div>
                <span v-for="cat in (blog.categories || [])" :key="cat.id" class="blog-card-tag">{{ cat.name }}</span>
              </div>
              <span class="blog-card-date">{{ formatDate(blog.published_at || blog.created_at) }}</span>
            </div>
            <router-link :to="`/blog/${blog.id}`" class="blog-card-title" style="position:relative;z-index:2;">{{ blog.title }}</router-link>
            <div class="blog-card-desc" style="position:relative;z-index:2;">{{ blog.excerpt }}</div>
          </div>
        </div>
      </div>
      <div ref="sentinel" style="height:1px;"></div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!hasMore && list.length>0" class="loading">没有更多了</div>
    </div>
    <div class="side">
      <Sidebar />
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiPosts, apiMeta } from '../api';
import Sidebar from '../components/Sidebar.vue';

const route = useRoute();
const router = useRouter();
const categories = ref([]);
const tags = ref([]);

const search = ref('');
const sortDesc = ref(true);
const sortLabel = computed(() => sortDesc.value ? '最新' : '最旧');
const showFilter = ref(false);

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
    q: search.value || undefined,
    category: route.query.category,
    tag: route.query.tag,
    sort: sortDesc.value ? 'desc' : 'asc',
  };
  const res = await apiPosts.list(params);
  const rows = res.data.posts || res.data || [];
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

function toggleSort() { sortDesc.value = !sortDesc.value; reload(); }
function applyQuery(q) { router.replace({ name: 'Home', query: { ...route.query, ...q } }); }
function clearFilters() { router.replace({ name: 'Home', query: {} }); }
function goDetail(id) { router.push(`/blog/${id}`); }

watch(() => [route.query.category, route.query.tag], () => reload());
watch(() => search.value, (v, o) => {}, { flush: 'post' });

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
.layout { display:grid; grid-template-columns: 1fr 320px; gap: 18px; }
.main { min-width: 0; }
.side { min-width: 0; }
.filter-panel { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px; }
.filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
.filter-title { width:52px; color:var(--muted); font-size:13px; }
.chip { background:var(--chip); border:1px solid var(--chip-border); color:var(--text); padding:6px 10px; border-radius:16px; font-size:12px; cursor:pointer; }
.chip.active { outline: 2px solid var(--primary-1); }
.fade-enter-active,.fade-leave-active { transition: opacity .15s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
.list-masonry { display:flex; flex-direction:column; }
.loading { text-align:center; color:var(--muted); margin: 8px 0 16px; }
.blog-search-bar { display:flex; align-items:center; background:var(--card); border:1px solid var(--border); border-radius:12px; margin-bottom:12px; padding:14px 16px; }
.blog-search-input { flex:1; padding:10px 13px; font-size:16px; border-radius:8px; border:none; background:var(--bg); color:var(--text); }
.blog-search-input:focus { outline:none; filter: brightness(1.05); }
.blog-search-btns { display:flex; gap:9px; margin-left:8px; }
.icon-btn { background:none; border:1px solid var(--border); color:var(--text); padding:6px 9px; cursor:pointer; border-radius:8px; height:36px; display:flex; align-items:center; }
.icon-btn:hover { filter: brightness(0.95); }
.blog-card { background:var(--card); color:var(--text); border:1px solid var(--border); border-radius:14px; display:flex; margin-bottom:22px; box-shadow:0 2px 10px #0b0f191f; overflow:hidden; transition:box-shadow .15s; }
.blog-card:hover { box-shadow:0 10px 28px #0b15333d; }
.blog-card-img { width:310px; height:180px; object-fit:cover; background:#1b2336; flex-shrink:0; }
.blog-card-main { flex:1; padding:28px 22px 22px 28px; display:flex; flex-direction:column; justify-content:center; }
.blog-card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.blog-card-tag { background:var(--primary-1); border:1px solid var(--primary-2); color:#fff; font-size:12px; padding:3px 10px; border-radius:8px; margin-right:8px; }
.blog-card-date { font-size:14px; color:var(--muted); }
.blog-card-title { color:var(--text); font-size:22px; font-weight:700; margin:6px 0 10px 0; display:block; }
.blog-card-desc { color:#b8c6e2; font-size:15px; line-height:1.72; }
</style>
