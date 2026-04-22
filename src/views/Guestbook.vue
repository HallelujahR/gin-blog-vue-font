<template>
  <div class="guestbook-page">
    <section class="guestbook-hero">
      <p class="guestbook-kicker">Guestbook</p>
      <h1>留言板</h1>
      <p class="guestbook-intro">
        欢迎留下你的想法、建议或者一句路过的问候。留言提交后会先进入审核，审核通过后展示在这里。
      </p>
    </section>

    <section class="guestbook-grid">
      <div class="guestbook-panel">
        <div class="guestbook-panel-head">
          <h2>写一条留言</h2>
          <span class="guestbook-meta">保持和站点一样温和、简洁就很好</span>
        </div>
        <div class="guestbook-form">
          <div class="guestbook-row">
            <input v-model="form.author_name" type="text" placeholder="你的名字" class="guestbook-input" />
            <input v-model="form.author_email" type="email" placeholder="你的邮箱" class="guestbook-input" />
          </div>
          <textarea
            v-model="form.content"
            rows="6"
            placeholder="写下你想说的话..."
            class="guestbook-textarea"
          />
          <div class="guestbook-actions">
            <span class="guestbook-tip">内容公开前会先审核一次。</span>
            <button @click="submitMessage" :disabled="submitting" class="guestbook-submit">
              {{ submitting ? '提交中...' : '提交留言' }}
            </button>
          </div>
        </div>
      </div>

      <div class="guestbook-panel">
        <div class="guestbook-panel-head">
          <h2>最近留言</h2>
          <span class="guestbook-meta">已展示 {{ messages.length }} 条</span>
        </div>

        <div v-if="loading" class="guestbook-empty">留言加载中...</div>
        <div v-else-if="messages.length === 0" class="guestbook-empty">还没有公开留言，来写第一条吧。</div>
        <div v-else class="guestbook-list">
          <article v-for="message in messages" :key="message.id" class="guestbook-card">
            <div class="guestbook-card-head">
              <strong>{{ message.author_name }}</strong>
              <time>{{ formatDate(message.created_at) }}</time>
            </div>
            <p>{{ message.content }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiGuestbook } from '../api/index.js';
import { showToast } from '../utils/toast';

const loading = ref(false);
const submitting = ref(false);
const messages = ref([]);
const form = ref({
  author_name: '',
  author_email: '',
  content: '',
});

const fetchMessages = async () => {
  loading.value = true;
  try {
    const response = await apiGuestbook.list({ page: 1, page_size: 30 });
    messages.value = response.data?.messages || response.data?.data?.messages || [];
  } catch (error) {
    console.error('获取留言失败:', error);
    showToast('获取留言失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const submitMessage = async () => {
  if (!form.value.author_name.trim() || !form.value.author_email.trim() || !form.value.content.trim()) {
    showToast('请完整填写昵称、邮箱和留言内容', 'warn');
    return;
  }

  submitting.value = true;
  try {
    const response = await apiGuestbook.create({
      author_name: form.value.author_name.trim(),
      author_email: form.value.author_email.trim(),
      content: form.value.content.trim(),
    });
    showToast(response.data?.notice || '留言已提交，等待审核', 'success', 3200);
    form.value = {
      author_name: '',
      author_email: '',
      content: '',
    };
  } catch (error) {
    console.error('提交留言失败:', error);
    showToast(error.response?.data?.error || '提交留言失败', 'error', 3200);
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.guestbook-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 18px 20px 40px;
}

.guestbook-hero {
  margin-bottom: 24px;
  padding: 30px 32px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(122, 122, 122, 0.07);
  background-color: rgba(253, 253, 253, 0.4);
  background-image: var(--paper-glow), var(--paper-texture);
}

.guestbook-kicker {
  margin: 0 0 8px;
  color: var(--primary-1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 12px;
}

.guestbook-hero h1 {
  margin: 0 0 10px;
  color: var(--text-head);
  font-size: 2.1rem;
}

.guestbook-intro {
  max-width: 640px;
  margin: 0;
  color: var(--muted);
  line-height: 1.9;
}

.guestbook-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 20px;
}

.guestbook-panel {
  border-radius: var(--radius-md);
  border: 1px solid rgba(122, 122, 122, 0.07);
  background-color: rgba(253, 253, 253, 0.32);
  background-image: var(--paper-glow), var(--paper-texture);
  padding: 22px;
}

.guestbook-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.guestbook-panel-head h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-head);
}

.guestbook-meta,
.guestbook-tip,
.guestbook-empty,
.guestbook-card time {
  color: var(--muted);
  font-size: 13px;
}

.guestbook-form,
.guestbook-list {
  display: grid;
  gap: 14px;
}

.guestbook-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.guestbook-input,
.guestbook-textarea {
  width: 100%;
  border: 1px solid rgba(122, 122, 122, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font: inherit;
  box-sizing: border-box;
}

.guestbook-textarea {
  resize: vertical;
  line-height: 1.8;
  min-height: 140px;
}

.guestbook-input:focus,
.guestbook-textarea:focus {
  outline: none;
  border-color: var(--primary-1);
  box-shadow: 0 0 0 1px rgba(107, 143, 113, 0.14);
}

.guestbook-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.guestbook-submit {
  border: 1px solid rgba(107, 143, 113, 0.18);
  background: rgba(107, 143, 113, 0.12);
  color: var(--primary-1);
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font: inherit;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.guestbook-submit:hover:not(:disabled) {
  background: rgba(107, 143, 113, 0.18);
  border-color: rgba(107, 143, 113, 0.26);
  transform: translateY(-1px);
}

.guestbook-submit:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.guestbook-card {
  padding-top: 14px;
  border-top: 1px solid rgba(122, 122, 122, 0.06);
}

.guestbook-card:first-child {
  padding-top: 0;
  border-top: none;
}

.guestbook-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.guestbook-card strong {
  color: var(--text);
}

.guestbook-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.9;
  white-space: pre-wrap;
}

@media (max-width: 820px) {
  .guestbook-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .guestbook-page {
    padding-inline: 14px;
  }

  .guestbook-hero,
  .guestbook-panel {
    padding: 18px;
  }

  .guestbook-row {
    grid-template-columns: 1fr;
  }

  .guestbook-actions,
  .guestbook-panel-head,
  .guestbook-card-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
