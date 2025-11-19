<template>
  <div class="about-page" style="padding:32px 2px;min-height:200px;">
    <div v-if="loading" style="text-align:center;padding:40px;">
      <p>加载中...</p>
    </div>
    <div v-else-if="error" style="text-align:center;padding:40px;color:#ef4444;">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="page">
      <h1>{{ page.title || '' }}</h1>
      <div 
        class="page-content" 
        v-html="page.content"
        style="font-size:18px;color:var(--text);max-width:800px;margin:24px 0;line-height:1.8;"
      ></div>
      <h1>About ME</h1>
      <div >
          <p class="company">Developer / Designer / Backend Engineer</p>
          <div class="role">
            <p>Hi，我是 Ruiwen。</p>
            <p>出生在延边，入行服务端开发已经第 6 年。常听人说，东北人的成年礼是一张离开家乡的车票，如今看来确实如此。</p>
            <p>我相信代码让人理性，生活让人温柔。希望能在不断学习与实践中，写出更优雅的代码，也过上更有温度的生活。</p>
          </div>
        </div>
      <section class="about-experience">

        <h3>工作经历</h3>
        <div class="experience-list">
          <article class="experience-card">
            <p class="company">百度科技（外派）</p>
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

.about-highlight {
  background: var(--card);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
  margin: 48px 0 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lead-tag {
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.about-highlight h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.about-highlight p {
  margin: 0;
  font-size: 16px;
  color: var(--text);
  line-height: 1.8;
}


.about-experience,
.about-hobbies {
  margin: 32px 0;
}

.about-experience h3,
.about-hobbies h3 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.experience-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.experience-card {
  border-radius: 14px;
  padding: 16px 18px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.company {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.role {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted);
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
  .about-highlight,
  .contact-section,
  .experience-card {
    padding: 18px;
  }

  .about-highlight h2 {
    font-size: 22px;
  }

  .about-highlight p,
  .hobby-intro,
  .experience-card .role,
  .experience-card .company {
    font-size: 14px;
    line-height: 1.6;
  }

  .experience-card {
    border-radius: 12px;
  }

  .experience-list {
    gap: 10px;
  }

  .hobby-list {
    padding-left: 16px;
  }
}
</style>
