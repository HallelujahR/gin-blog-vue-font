<template>
  <div class="tools-page">
    <header class="page-header">
      <h1>工具集合</h1>
      <p class="lead">快速访问一些轻量、有趣或实用的小工具。</p>
    </header>
    <section class="tool-full analytics">
      <StatsOverview />
    </section>
    <h2 class="section-title">小工具入口</h2>
    <div class="tool-list">
      <article class="tool-card" @click="go('ToolsImageCompress')">
        <div class="tool-logo gradient">
          <span class="tool-logo-text">IMG</span>
        </div>
        <div class="tool-info">
          <h2>图片压缩工具</h2>
          <p>上传图片，一键压缩，实时查看进度与累计节省空间，适合博客配图与日常分享。</p>
        </div>
        <button class="enter-btn" type="button">进入</button>
      </article>
      <article class="tool-card" @click="go('ToolsCat')">
        <img :src="catLogo" alt="猫咪工具" class="tool-logo" />
        <div class="tool-info">
          <h2>随机猫咪生成器</h2>
          <p>随手一按，随机获取一张来自世界各地的猫咪照片，治愈你的碎片时间。</p>
        </div>
        <button class="enter-btn" type="button">进入</button>
      </article>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router';
import catLogo from '../assets/tool-cat.svg';
import StatsOverview from '../components/StatsOverview.vue';

const router = useRouter();
const go = (name) => {
  router.push({ name });
};
</script>
<style scoped>
.tools-page { max-width: 960px; margin: 0 auto; padding: 18px 0 48px; display: flex; flex-direction: column; gap: 26px; }
.page-header h1 { margin: 0 0 6px; font-size: 26px; font-weight: 700; color: var(--text); }
.lead { margin: 0; color: var(--muted); font-size: 14px; }
.tool-list { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.tool-card { position: relative; display: flex; flex-direction: column; gap: 18px; padding: 22px; border-radius: 16px; background: var(--card); box-shadow: 0 10px 28px rgba(15,23,42,0.08); color: var(--text); cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; }
.tool-card:hover { transform: translateY(-2px); box-shadow: 0 18px 34px rgba(15,23,42,0.12); }
.tool-logo { width: 72px; height: 72px; border-radius: 16px; }
.tool-logo.gradient {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 0% 0%, #38bdf8, transparent 55%), radial-gradient(circle at 100% 100%, #a855f7, transparent 55%), #0f172a;
}
.tool-logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #e5f0ff;
}
.tool-info h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text); }
.tool-info p { margin: 6px 0 0; font-size: 14px; color: var(--muted); line-height: 1.6; }
.enter-btn { align-self: flex-start; padding: 0 16px; height: 32px; border-radius: 999px; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.tool-card:hover .enter-btn { transform: translateX(2px); box-shadow: 0 10px 20px rgba(99,102,241,0.28); }
.tool-full { display: flex; flex-direction: column; gap: 16px; }
.analytics { order: 0; }
.section-title { margin: 12px 0 -4px; font-size: 18px; font-weight: 600; color: var(--text); }
</style>

