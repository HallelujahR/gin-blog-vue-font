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
.sidebar { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.box { background-color: rgba(253, 253, 253, 0.52); background-image: var(--paper-glow), var(--paper-texture); border: 1px solid rgba(122, 122, 122, 0.08); border-radius: var(--radius-md); padding: 14px 16px; box-shadow: none; transition: border-color .2s ease, background-color .2s ease; }
.box:hover { border-color: rgba(107, 143, 113, 0.18); background-color: rgba(253, 253, 253, 0.68); }
h3 { margin: 0 0 10px; font-size: 15px; color: var(--text-head); font-family: var(--font-body); }
.list { list-style: none; padding: 0; margin: 0; }
.list-item { padding: 8px 0; border-bottom: 1px dashed var(--border-light); }
.list-item a { color: var(--text); opacity: .85; transition: color .2s ease, opacity .2s ease; }
.list-item a:hover { color: var(--primary-1); opacity: 1; }
.list-item:last-child { border: none; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { background: transparent; border: 1px solid rgba(107, 143, 113, 0.22); color: var(--muted); padding: 3px 10px; border-radius: var(--radius-sm); font-size: 12px; transition: border-color .18s, color .18s, background .18s; }
.chip:hover { border-color: var(--primary-1); color: var(--primary-1); }
.chip.active { background: var(--chip-active-bg); border-color: rgba(107, 143, 113, 0.34); color: var(--primary-1); font-weight: 600; }
.toggle-btn {
  margin-top: 12px;
  width: 100%;
  border: 1px dashed rgba(122, 122, 122, 0.12);
  background: transparent;
  color: var(--muted);
  padding: 6px 0;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: border-color .18s, color .18s;
}
.toggle-btn:hover {
  border-color: var(--primary-1);
  color: var(--primary-1);
}

@media (max-width: 640px) {
  .sidebar {
    gap: 12px;
  }
  .box {
    padding: 12px 14px;
  }
}
</style>
