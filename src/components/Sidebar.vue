<template>
  <aside class="sidebar">
    <section class="box">
      <h3>分类</h3>
      <div class="chips">
        <a
          v-for="c in displayedCategories"
          :key="c.id"
          class="chip"
          :class="{ active: route.query.category === c.slug }"
          href="#"
          @click.prevent="toggleCategory(c.slug)"
        >{{ c.name }}</a>
      </div>
      <button
        v-if="categories.length > categoryDisplayLimit"
        class="toggle-btn"
        type="button"
        @click="showAllCategories = !showAllCategories"
      >
        {{ showAllCategories ? '收起' : `展开更多（${categories.length - categoryDisplayLimit}）` }}
      </button>
    </section>
    <section class="box">
      <h3>标签</h3>
      <div class="chips">
        <a
          v-for="t in displayedTags"
          :key="t.id"
          class="chip"
          :class="{ active: route.query.tag === t.slug }"
          href="#"
          @click.prevent="toggleTag(t.slug)"
        >#{{ t.name }}</a>
      </div>
      <button
        v-if="tags.length > tagDisplayLimit"
        class="toggle-btn"
        type="button"
        @click="showAllTags = !showAllTags"
      >
        {{ showAllTags ? '收起' : `展开更多（${tags.length - tagDisplayLimit}）` }}
      </button>
    </section>
  </aside>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiMeta } from '../api';

const route = useRoute();
const router = useRouter();
const categories = ref([]);
const tags = ref([]);
const showAllCategories = ref(false);
const categoryDisplayLimit = 12;
const showAllTags = ref(false);
const tagDisplayLimit = 20;

onMounted(async () => {
  try {
    const [catRes, tagRes] = await Promise.all([
      apiMeta.categories(),
      apiMeta.tags(),
    ]);
    categories.value = (catRes.data && (catRes.data.categories || catRes.data)) || [];
    tags.value = (tagRes.data && (tagRes.data.tags || tagRes.data)) || [];
  } catch (e) {}
});

const displayedCategories = computed(() => {
  if (showAllCategories.value) return categories.value;
  return categories.value.slice(0, categoryDisplayLimit);
});

function toggleCategory(slug) {
  const current = route.query.category;
  const next = current === slug ? undefined : slug;
  router.replace({ name: 'Home', query: { ...route.query, category: next } });
}

const displayedTags = computed(() => {
  if (showAllTags.value) return tags.value;
  return tags.value.slice(0, tagDisplayLimit);
});

function toggleTag(slug) {
  const current = route.query.tag;
  const next = current === slug ? undefined : slug;
  router.replace({ name: 'Home', query: { ...route.query, tag: next } });
}
</script>
<style scoped>
.sidebar { position: sticky; top: calc(var(--nav-height) + 12px); display: flex; flex-direction: column; gap: 16px; }
.box { background: var(--card); border: none; border-radius: 12px; padding:14px 16px; box-shadow: 0 6px 18px rgba(17,24,39,.04); transition: box-shadow .2s ease; }
.box:hover { box-shadow: 0 10px 24px rgba(17,24,39,.08); }
h3 { margin: 0 0 10px; font-size:16px; color: var(--text); }
.list { list-style:none; padding:0; margin:0; }
.list-item { padding:8px 0; border-bottom: 1px dashed #eef2f7; }
.list-item a { color: var(--text); opacity: .85; transition: color .2s ease, opacity .2s ease; }
.list-item a:hover { color: #4f46e5; opacity: 1; }
.list-item:last-child { border: none; }
.chips { display:flex; flex-wrap:wrap; gap:8px; }
.chip { background: var(--chip); border:1px solid var(--chip-border); color: var(--text); padding:6px 12px; border-radius:16px; font-size:12px; transition: transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease; }
.chip:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,.15); }
.chip.active { background: #e0e7ff; border-color: #c7d2fe; color: #3730a3; font-weight: 700; }
.toggle-btn {
  margin-top: 12px;
  width: 100%;
  border: 1px dashed #d1d5db;
  background: rgba(148, 163, 184, 0.08);
  color: #475569;
  padding: 6px 0;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.toggle-btn:hover {
  background: rgba(79, 70, 229, 0.08);
  color: #4338ca;
  border-color: #a5b4fc;
}
</style>
