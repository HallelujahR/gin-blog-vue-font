<template>
  <div class="tool-wrapper">
    <section class="card">
      <header class="card-header">
        <div>
          <h1>随机猫咪生成器</h1>
          <p class="subtitle">调用 The Cat API，每次点按都会带来一只新猫猫。</p>
        </div>
        <button
          class="fetch-btn"
          type="button"
          :disabled="loading"
          @click="fetchCat"
        >
          {{ loading ? '加载中...' : '换一只猫猫' }}
        </button>
      </header>
      <Transition name="fade">
        <div v-if="error" class="error-banner">
          <span>没有抓到猫咪：{{ error }}</span>
          <button type="button" @click="fetchCat">重试</button>
        </div>
      </Transition>
      <div class="cat-stage">
        <Transition name="fade">
          <div v-if="loading || imageLoading" class="loading-overlay">猫猫正在赶来...</div>
        </Transition>
        <Transition name="fade">
          <img
            v-if="catUrl"
            :key="catUrl"
            :src="catUrl"
            alt="随机猫咪"
            class="cat-img"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </Transition>
        <div v-if="!catUrl && !loading" class="placeholder">
          <span>点击按钮召唤一只猫咪 ✨</span>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

const catUrl = ref('');
const loading = ref(true);
const imageLoading = ref(true);
const error = ref('');

async function fetchCat() {
  loading.value = true;
  error.value = '';
  try {
    const resp = await fetch('https://api.thecatapi.com/v1/images/search');
    if (!resp.ok) throw new Error(`状态码 ${resp.status}`);
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0 && data[0]?.url) {
      const url = data[0].url;
      imageLoading.value = true;
      catUrl.value = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
    } else {
      throw new Error('返回数据异常');
    }
  } catch (err) {
    error.value = err?.message || '未知错误';
  } finally {
    loading.value = false;
  }
}

function handleImageLoad() {
  imageLoading.value = false;
}

function handleImageError() {
  imageLoading.value = false;
  error.value = '图片加载失败，请重试';
}

onMounted(async () => {
  imageLoading.value = true;
  await fetchCat();
});
</script>
<style scoped>
.tool-wrapper { max-width: 960px; margin: 0 auto; padding: 12px 0 40px; }
.card { background: var(--card); color: var(--text); border: none; border-radius: 16px; padding: 24px 28px 32px; box-shadow: 0 10px 28px rgba(15,23,42,0.08); display: flex; flex-direction: column; gap: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
h1 { margin: 0 0 6px; font-size: 24px; font-weight: 700; color: var(--text); }
.subtitle { margin: 0; font-size: 14px; color: var(--muted); }
.fetch-btn { padding: 0 18px; height: 36px; border-radius: 999px; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 12px 24px rgba(99, 102, 241, 0.28); transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
.fetch-btn:hover { transform: translateY(-1px); box-shadow: 0 16px 32px rgba(99, 102, 241, 0.32); }
.fetch-btn:active { transform: translateY(0); }
.fetch-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
.cat-stage { position: relative; min-height: 260px; border-radius: 14px; background: transparent; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cat-img { width: 100%; height: auto; max-height: 480px; border-radius: 14px; box-shadow: 0 20px 38px rgba(30, 41, 59, 0.18); object-fit: contain; }
.placeholder { font-size: 14px; color: #64748b; }
.loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.9); color: #475569; font-size: 14px; backdrop-filter: blur(2px); border-radius: inherit; pointer-events: none; }
.error-banner { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(248, 113, 113, 0.16); border-radius: 10px; color: #b91c1c; font-size: 13px; }
.error-banner button { border: none; background: transparent; color: #b91c1c; font-weight: 600; cursor: pointer; text-decoration: underline; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

