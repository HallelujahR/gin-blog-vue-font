<template>
  <div class="about-page" style="padding:32px 2px;min-height:200px;">
    <div v-if="loading" style="text-align:center;padding:40px;">
      <p>加载中...</p>
    </div>
    <div v-else-if="error" style="text-align:center;padding:40px;color:#ef4444;">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="page">
      <h1>{{ page.title || '关于我' }}</h1>
      <div 
        class="page-content" 
        v-html="page.content"
        style="font-size:18px;color:var(--text);max-width:800px;margin:24px 0;line-height:1.8;"
      ></div>
      <TechStack />
    </div>
    <div v-else style="text-align:center;padding:40px;color:#64748b;">
      <p>暂无内容</p>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/index.js';
import TechStack from '../components/TechStack.vue';

const page = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    loading.value = true;
    // 通过ID获取关于我页面（id为1）
    const response = await http.get('/pages/1');
    page.value = response.data?.page || response.data;
  } catch (err) {
    error.value = '页面加载失败';
    console.error('获取关于我页面失败:', err);
  } finally {
    loading.value = false;
  }
});
</script>
<style scoped>
.about-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-content :deep(h1),
.page-content :deep(h2),
.page-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text);
}

.page-content :deep(p) {
  margin-bottom: 16px;
}

.page-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.page-content :deep(a) {
  color: #4f46e5;
  text-decoration: none;
}

.page-content :deep(a:hover) {
  text-decoration: underline;
}

.page-content :deep(ul),
.page-content :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.page-content :deep(li) {
  margin-bottom: 8px;
}
</style>
