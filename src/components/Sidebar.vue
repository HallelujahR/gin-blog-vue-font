<template>
  <aside class="sidebar">
    <section class="box">
      <h3>热门</h3>
      <ul class="list">
        <li v-for="item in hotPosts" :key="item.id" class="list-item">
          <router-link :to="`/blog/${item.id}`">{{ item.title }}</router-link>
        </li>
      </ul>
    </section>
    <section class="box">
      <h3>分类</h3>
      <div class="chips">
        <a
          v-for="c in categories"
          :key="c.id"
          class="chip"
          :class="{ active: route.query.category === c.slug }"
          href="#"
          @click.prevent="toggleCategory(c.slug)"
        >{{ c.name }}</a>
      </div>
    </section>
    <section class="box">
      <h3>标签</h3>
      <div class="chips">
        <a
          v-for="t in tags"
          :key="t.id"
          class="chip"
          :class="{ active: route.query.tag === t.slug }"
          href="#"
          @click.prevent="toggleTag(t.slug)"
        >#{{ t.name }}</a>
      </div>
    </section>
  </aside>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiHot, apiMeta } from '../api';

const route = useRoute();
const router = useRouter();
const hotPosts = ref([]);
const categories = ref([]);
const tags = ref([]);

onMounted(async () => {
  try {
    const [hotRes, catRes, tagRes] = await Promise.all([
      apiHot.list(),
      apiMeta.categories(),
      apiMeta.tags(),
    ]);
    // 热门：接口返回 { list: [...] }
    const list = (hotRes.data && hotRes.data.list) || [];
    const rawHot = list.filter(x => x.data_type === 'trending_posts');
    const extract = [];
    rawHot.forEach(row => {
      let v = row.data_value;
      try {
        if (typeof v === 'string') v = JSON.parse(v);
      } catch (e) {}
      if (Array.isArray(v)) extract.push(...v);
    });
    hotPosts.value = extract.slice(0, 6);

    categories.value = (catRes.data && (catRes.data.categories || catRes.data)) || [];
    tags.value = (tagRes.data && (tagRes.data.tags || tagRes.data)) || [];
  } catch (e) {}
});

function toggleCategory(slug) {
  const current = route.query.category;
  const next = current === slug ? undefined : slug;
  router.replace({ name: 'Home', query: { ...route.query, category: next } });
}

function toggleTag(slug) {
  const current = route.query.tag;
  const next = current === slug ? undefined : slug;
  router.replace({ name: 'Home', query: { ...route.query, tag: next } });
}
</script>
<style scoped>
.sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
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
</style>
