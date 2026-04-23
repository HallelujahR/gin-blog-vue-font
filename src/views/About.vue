<template>
  <div class="about-page">
    <div v-if="loading" class="about-loading">
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="about-error">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="page">
      <h1>{{ page.title || '' }}</h1>
      <template v-if="isHtmlContent">
        <div
          class="page-content"
          v-html="page.content"
        ></div>
      </template>
      <template v-else>
        <MdPreview
          class="page-content"
          :modelValue="page.content || ''"
          previewTheme="github"
        />
      </template>
      <h1>About ME</h1>
      <section class="about-intro">
        <p class="company">Developer / Designer / Backend Engineer</p>
        <div class="role">
          <p>Hi，我是 Ruiwen。</p>
          <p>出生在延边，入行服务端开发已经第 6 年。常听人说，东北人的成年礼是一张离开家乡的车票，如今看来确实如此。</p>
          <p>我相信代码让人理性，生活让人温柔。希望能在不断学习与实践中，写出更优雅的代码，也过上更有温度的生活。</p>
        </div>
      </section>
      <section class="about-experience">
        <h3>工作经历</h3>
        <div class="experience-list">
          <article class="experience-card">
            <p class="company">百度科技</p>
            <p class="role">Golang 开发工程师</p>
          </article>
          <article class="experience-card">
            <p class="company">绿法联盟信息技术</p>
            <p class="role">PHP 开发工程师</p>
          </article>
        </div>
      </section>

      <section class="about-hobbies">
        <h3>兴趣爱好</h3>
        <p class="hobby-intro">摄影、旅游、PlayStation、Steam、Coding、电影。</p>
        <ul class="hobby-list">
          <li>喜欢用镜头记录不经意的瞬间，也常把旅途中的点滴整理成故事。</li>
          <li>闲暇时刻沉浸在 PlayStation 与 Steam 的世界里，享受好剧情与好音效。</li>
          <li>Coding 对我来说不止是工作，也是一种自我表达：不断尝试新框架、新语言、新想法。</li>
          <li>热爱电影，尤其是能把体温与人性的细节刻画得恰到好处的作品。</li>
        </ul>
      </section>

      <TechStack />
    </div>
    <div v-else class="about-empty">
      <p>暂无内容</p>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import http from '../api/index.js';
import TechStack from '../components/TechStack.vue';

const page = ref(null);
const loading = ref(true);
const error = ref('');
const isHtmlContent = computed(() => {
  const content = page.value?.content || '';
  if (!content) return false;
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  const hasMdHeading = /^#{1,6}\s/m.test(content);
  return looksHtml && !hasMdHeading;
});

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
  padding: 12px 0 24px;
}

.about-loading,
.about-error,
.about-empty {
  padding: 40px 0;
  text-align: center;
}

.about-error {
  color: #C45C5C;
}

.about-page > h1,
.about-page :deep(h1) {
  margin: 0 0 16px;
  color: var(--text-head);
}

.page-content {
  margin: 20px 0 32px;
  padding: 10px 2px 20px;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  font-size: 17px;
  color: var(--text);
  line-height: 1.9;
}

.page-content :deep(.md-editor-preview) {
  padding: 0;
  background: transparent;
  color: inherit;
  word-break: break-word;
}

.page-content :deep(h1),
.page-content :deep(h2),
.page-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-head);
}

.page-content :deep(p) {
  margin-bottom: 16px;
}

.page-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin: 16px 0;
}

.page-content :deep(a) {
  color: var(--primary-1);
  text-decoration: none;
}

.page-content :deep(a:hover) {
  color: var(--primary-2);
}

.page-content :deep(ul),
.page-content :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.page-content :deep(li) {
  margin-bottom: 8px;
}

.page-content :deep(blockquote) {
  margin: 0 0 1.1em;
  padding-left: 1em;
  border-left: 2px solid var(--primary-1);
  color: var(--muted);
}

.about-intro,
.about-experience,
.about-hobbies {
  margin: 34px 0;
}

.about-intro,
.experience-card,
.about-hobbies {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.about-intro {
  padding: 0;
}

.about-experience h3,
.about-hobbies h3 {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-head);
}

.experience-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.experience-card {
  padding: 12px 0;
  border-bottom: 1px solid rgba(122, 122, 122, 0.08);
}

.experience-card:last-child {
  border-bottom: none;
}

.company {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-head);
}

.role {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.8;
}

.about-hobbies {
  padding: 0;
}

.hobby-intro {
  margin: 0 0 6px;
  font-size: 16px;
  color: var(--text);
}

.hobby-list {
  margin: 0;
  padding-left: 20px;
  color: var(--muted);
  line-height: 1.8;
}

.hobby-list li {
  margin-bottom: 6px;
}

@media (max-width: 640px) {
  .about-page {
    padding-bottom: 12px;
  }
  .about-page > h1,
  .about-page :deep(h1) {
    font-size: 1.55rem;
    margin-bottom: 12px;
  }
  .page-content,
  .about-intro,
  .about-hobbies,
  .experience-card {
    padding-left: 0;
    padding-right: 0;
  }
  .page-content {
    font-size: 15px;
    line-height: 1.85;
    margin-bottom: 24px;
    padding-top: 4px;
    padding-bottom: 16px;
  }

  .hobby-intro,
  .experience-card .role,
  .experience-card .company {
    font-size: 14px;
    line-height: 1.6;
  }

  .experience-list {
    gap: 10px;
  }

  .hobby-list {
    padding-left: 16px;
  }
}
</style>
