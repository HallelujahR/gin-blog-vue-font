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
        <router-link v-for="c in categories" :key="c.id" class="chip" :to="{name:'Home', query:{ category: c.slug }}">{{ c.name }}</router-link>
      </div>
    </section>
    <section class="box">
      <h3>标签</h3>
      <div class="chips">
        <router-link v-for="t in tags" :key="t.id" class="chip" :to="{name:'Home', query:{ tag: t.slug }}">#{{ t.name }}</router-link>
      </div>
    </section>
  </aside>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiHot, apiMeta } from '../api';

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
</script>
<style scoped>
.sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
.box { background:#0f1420; border:1px solid #2a3242; border-radius:12px; padding:14px 16px; }
h3 { margin: 0 0 10px; font-size:16px; color:#eaf1ff; }
.list { list-style:none; padding:0; margin:0; }
.list-item { padding:6px 0; border-bottom:1px dashed #223; }
.list-item:last-child { border: none; }
.chips { display:flex; flex-wrap:wrap; gap:8px; }
.chip { background:#16223c; border:1px solid #2a3242; color:#d9e5ff; padding:5px 10px; border-radius:16px; font-size:12px; }
</style>
