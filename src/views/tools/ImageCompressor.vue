<template>
  <div class="compress-page">
    <header class="page-header">
      <h1>图片压缩工具</h1>
      <p class="lead">上传图片，一键压缩并下载，减小体积、保留清晰度。</p>
    </header>

    <section class="stats-row" v-if="summary">
      <div class="stat-card">
        <p class="label">累计任务</p>
        <p class="value">{{ summary.total_tasks }}</p>
      </div>
      <div class="stat-card">
        <p class="label">成功处理图片</p>
        <p class="value">{{ summary.total_images }}</p>
      </div>
      <div class="stat-card">
        <p class="label">累计节省空间</p>
        <p class="value">{{ humanSize(summary.total_bytes_saved) }}</p>
      </div>
    </section>

    <section class="tool-panel">
      <div class="panel-main">
        <div class="file-info" v-if="files.length">
          <p class="file-name">
            已选择 {{ files.length }} 个文件
          </p>
          <p class="file-meta">
            总大小：{{ humanSize(totalSize) }}
          </p>
        </div>
        <p v-else class="file-placeholder">
          支持常见图片格式（JPG / PNG / WebP 等），单文件上传。
        </p>

        <div class="quality-row">
          <div>
            <p class="label">压缩质量(百分比)</p>
            <p class="hint">数值越低压缩越狠，一般推荐 60 - 80。</p>
          </div>
          <div class="quality-control">
            <input
              type="range"
              min="40"
              max="100"
              v-model.number="quality"
            />
            <span class="quality-value">{{ quality }}%</span>
          </div>
        </div>

        <button
          class="main-btn"
          type="button"
          :disabled="mainDisabled"
          @click="onMainClick"
        >
          <span v-if="stage === 'idle'">点击上传文件</span>
          <span v-else-if="stage === 'uploading'">上传中… {{ uploadPercent }}%</span>
          <span v-else-if="stage === 'ready'">开始压缩</span>
          <span v-else-if="stage === 'processing'">压缩中… {{ processPercent }}%</span>
          <span v-else-if="stage === 'done'">点击下载压缩后的图片</span>
        </button>

        <div class="progress-row" v-if="stage === 'uploading' || stage === 'processing'">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (stage === 'uploading' ? uploadPercent : processPercent) + '%' }"
            ></div>
          </div>
          <span class="progress-text">
            {{ stage === 'uploading' ? '正在上传原图…' : '服务端正在压缩图片…' }}
          </span>
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>
      </div>
    </section>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden-input"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { apiImageCompress } from '../../api';

const summary = ref(null);
const files = ref([]);
const quality = ref(80);
const uploadPercent = ref(0);
const processPercent = ref(0);
const stage = ref('idle'); // idle | uploading | processing | done
const error = ref('');
const downloadUrl = ref('');
const taskId = ref('');

const fileInput = ref(null);
let eventSource = null;

const mainDisabled = computed(
  () => stage.value === 'uploading' || stage.value === 'processing'
);

const totalSize = computed(() =>
  files.value.reduce((sum, f) => sum + (f?.size || 0), 0)
);

function humanSize(bytes = 0) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let num = bytes;
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024;
    i++;
  }
  return `${num.toFixed(1)} ${units[i]}`;
}

async function loadSummary() {
  try {
    const res = await apiImageCompress.stats();
    const data = res.data || {};
    summary.value = {
      total_tasks: data.total_jobs || 0,
      total_images: data.total_images || 0,
      total_bytes_saved: data.saved_bytes || 0,
    };
  } catch (e) {
    // 静默失败即可，不影响工具使用
  }
}

function onMainClick() {
  if (stage.value === 'done') {
    if (downloadUrl.value) {
      triggerDownload(downloadUrl.value);
    } else {
      resetState();
      fileInput.value?.click();
    }
    return;
  }

  if (stage.value === 'idle') {
    fileInput.value?.click();
  }
}

function onFileChange(e) {
  const list = Array.from(e.target.files || []);
  if (!list.length) return;
  resetState();
  files.value = list;
  startJob();
}

async function startJob() {
  if (!files.value.length) return;
  error.value = '';
  uploadPercent.value = 0;
  stage.value = 'uploading';
  try {
    const res = await apiImageCompress.startJob(
      files.value,
      quality.value,
      (evt) => {
        if (!evt.total) return;
        uploadPercent.value = Math.round((evt.loaded / evt.total) * 100);
      }
    );
    const data = res.data || {};
    taskId.value = data.job_id || data.id || '';
    if (!taskId.value) {
      throw new Error('后端未返回任务 ID，请检查接口返回字段（期望: job_id）');
    }
    // 上传成功并创建任务后，直接进入压缩阶段并打开进度流
    stage.value = 'processing';
    openProgressStream();
  } catch (e) {
    error.value = e?.message || '创建压缩任务失败，请稍后重试';
    stage.value = 'idle';
  }
}

function openProgressStream() {
  closeStream();
  const url = apiImageCompress.progressUrl(taskId.value);
  eventSource = new EventSource(url);
  eventSource.onmessage = (evt) => {
    try {
      const payload = JSON.parse(evt.data || '{}');
      const total = payload.total ?? payload.Total;
      const current = payload.current ?? payload.Current;

      if (typeof total === 'number' && typeof current === 'number' && total > 0) {
        processPercent.value = Math.min(
          100,
          Math.max(
            0,
            Math.round((current / total) * 100)
          )
        );
      } else if (
        typeof payload.compressed_percent === 'number' ||
        typeof payload.CompressedPercent === 'number'
      ) {
        const percent =
          payload.compressed_percent ?? payload.CompressedPercent;
        processPercent.value = Math.min(
          100,
          Math.max(0, Math.round(percent))
        );
      }

      const done = payload.done ?? payload.Done;
      const status = (payload.status ?? payload.Status ?? '').toLowerCase();

      if (done) {
        processPercent.value = 100;
        downloadUrl.value =
          payload.tar_url ||
          payload.TarURL ||
          payload.download_url ||
          payload.DownloadURL ||
          '';
        stage.value = 'done';
        loadSummary();
        closeStream();
      } else if (status === 'failed' || payload.error || payload.Error) {
        error.value = payload.error || payload.Error || '压缩失败';
        stage.value = 'idle';
        files.value = [];
        processPercent.value = 0;
        closeStream();
      }
    } catch (err) {
      // ignore parse error
    }
  };
  eventSource.onerror = () => {
    // 出错时结束流，避免一直重连
    closeStream();
  };
}

function closeStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function resetState() {
  closeStream();
  files.value = [];
  taskId.value = '';
  downloadUrl.value = '';
  uploadPercent.value = 0;
  processPercent.value = 0;
  stage.value = 'idle';
  error.value = '';
}

function triggerDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  loadSummary();
});

onBeforeUnmount(() => {
  closeStream();
});
</script>

<style scoped>
.compress-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 18px 0 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}

.lead {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--card);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.stat-card .label {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card .value {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.tool-panel {
  background: var(--card);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  padding: 24px 22px;
}

.panel-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  word-break: break-all;
}

.file-meta {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.file-placeholder {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.quality-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}

.quality-row .label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.quality-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quality-control input[type='range'] {
  width: 140px;
}

.quality-value {
  font-size: 13px;
  color: var(--text);
  min-width: 42px;
  text-align: right;
}

.main-btn {
  margin-top: 8px;
  width: 100%;
  border-radius: 999px;
  border: none;
  height: 44px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 30px rgba(88, 80, 236, 0.45);
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.main-btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.main-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 38px rgba(88, 80, 236, 0.55);
}

.progress-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  inset: 0;
  width: 0;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.2s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--muted);
}

.error-text {
  margin: 0;
  font-size: 12px;
  color: #b91c1c;
}

.hidden-input {
  display: none;
}

@media (max-width: 640px) {
  .compress-page {
    padding: 14px 0 32px;
  }

  .tool-panel {
    padding: 18px 16px;
    border-radius: 16px;
  }

  .quality-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .quality-control {
    width: 100%;
    justify-content: space-between;
  }

  .quality-control input[type='range'] {
    width: 100%;
  }
}
</style>


