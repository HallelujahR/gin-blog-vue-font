<template>
  <div class="moments-page">
    <section class="moments-hero">
      <p class="moments-kicker">Moments</p>
      <h1>碎碎念</h1>
      <p class="moments-intro">
        这里放一些没必要写成长文的记录，像时间流一样，轻一点，也更接近日常。
      </p>
    </section>

    <section class="timeline-shell">
      <div v-if="loading" class="timeline-empty">动态加载中...</div>
      <div v-else-if="moments.length === 0" class="timeline-empty">还没有公开的碎碎念。</div>
      <div v-else class="timeline-list">
        <article v-for="moment in moments" :key="moment.id" class="timeline-item">
          <div class="timeline-axis">
            <span class="timeline-dot"></span>
          </div>
          <div class="timeline-card">
            <header class="timeline-head">
              <time>{{ formatDate(moment.published_at || moment.created_at) }}</time>
              <span v-if="moment.mood" class="timeline-mood">{{ moment.mood }}</span>
            </header>
            <p class="timeline-content">{{ moment.content }}</p>
            <div v-if="moment.images?.length" class="timeline-gallery" :class="`count-${Math.min(moment.images.length, 4)}`">
              <img
                v-for="(image, index) in moment.images"
                :key="`${moment.id}-${index}`"
                :src="image"
                alt="moment"
                class="timeline-image"
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiMoments } from '../api/index.js';
import { showToast } from '../utils/toast';

const loading = ref(false);
const moments = ref([]);

const fetchMoments = async () => {
  loading.value = true;
  try {
    const response = await apiMoments.list({ limit: 60 });
    moments.value = response.data?.moments || [];
  } catch (error) {
    console.error('获取碎碎念失败:', error);
    showToast('获取碎碎念失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  fetchMoments();
});
</script>

<style scoped>
.moments-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 18px 20px 40px;
}

.moments-hero {
  margin-bottom: 28px;
  padding: 30px 32px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(122, 122, 122, 0.07);
  background-color: rgba(253, 253, 253, 0.4);
  background-image: var(--paper-glow), var(--paper-texture);
}

.moments-kicker {
  margin: 0 0 8px;
  color: var(--primary-1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 12px;
}

.moments-hero h1 {
  margin: 0 0 10px;
  color: var(--text-head);
  font-size: 2.1rem;
}

.moments-intro {
  max-width: 640px;
  margin: 0;
  color: var(--muted);
  line-height: 1.9;
}

.timeline-shell {
  position: relative;
}

.timeline-shell::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 22px;
  width: 1px;
  background: linear-gradient(180deg, rgba(107, 143, 113, 0.16), rgba(122, 122, 122, 0.06));
}

.timeline-list {
  display: grid;
  gap: 18px;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 16px;
}

.timeline-axis {
  position: relative;
  display: flex;
  justify-content: center;
}

.timeline-dot {
  width: 13px;
  height: 13px;
  margin-top: 16px;
  border-radius: 999px;
  border: 2px solid rgba(107, 143, 113, 0.26);
  background: rgba(250, 252, 247, 0.96);
  box-shadow: 0 0 0 5px rgba(107, 143, 113, 0.06);
}

.timeline-card {
  padding: 18px 20px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(122, 122, 122, 0.07);
  background-color: rgba(253, 253, 253, 0.32);
  background-image: var(--paper-glow), var(--paper-texture);
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 13px;
}

.timeline-mood {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(107, 143, 113, 0.18);
  color: var(--primary-1);
  background: rgba(107, 143, 113, 0.06);
}

.timeline-content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.95;
  color: var(--text);
}

.timeline-gallery {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.timeline-gallery.count-1 {
  grid-template-columns: 1fr;
}

.timeline-gallery.count-2,
.timeline-gallery.count-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.timeline-gallery.count-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.timeline-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid rgba(122, 122, 122, 0.08);
}

.timeline-empty {
  padding: 30px 20px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(122, 122, 122, 0.07);
  background-color: rgba(253, 253, 253, 0.32);
  background-image: var(--paper-glow), var(--paper-texture);
  color: var(--muted);
}

@media (max-width: 640px) {
  .moments-page {
    padding-inline: 14px;
  }

  .moments-hero,
  .timeline-card {
    padding: 18px;
  }

  .timeline-shell::before {
    left: 18px;
  }

  .timeline-item {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
  }

  .timeline-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .timeline-gallery.count-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
