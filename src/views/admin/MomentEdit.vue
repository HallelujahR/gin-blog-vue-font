<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">碎碎念编辑</p>
        <h2 class="admin-page-title">{{ isEdit ? '编辑碎碎念' : '发布碎碎念' }}</h2>
      </div>
      <div class="admin-inline-actions">
        <button @click="$router.back()" class="admin-btn admin-btn-ghost">返回</button>
        <button @click="handleSubmit" :disabled="loading" class="admin-btn">{{ loading ? '保存中...' : '保存' }}</button>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">轻量内容流</span>
        <span class="admin-statline">支持文字、图片和一个简短心情标记</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">{{ isEdit ? '编辑模式' : '创建模式' }}</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="admin-grid-edit">
      <section class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">内容</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <label>碎碎念内容 *</label>
              <textarea
                v-model="form.content"
                rows="12"
                placeholder="记录一下最近在做什么、看到什么、想到什么..."
                class="admin-textarea moment-textarea"
              ></textarea>
            </div>

            <div class="admin-fieldset">
              <label>心情标记</label>
              <input v-model="form.mood" type="text" placeholder="例如：今天有点开心" class="admin-input" />
            </div>

            <div class="admin-fieldset">
              <label>图片</label>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                class="admin-input"
                @change="handleImageSelect"
              />
              <div v-if="uploadingImages" class="admin-help">图片上传中，请稍候...</div>
              <div v-if="form.images.length" class="moment-gallery">
                <div v-for="(image, index) in form.images" :key="`${image}-${index}`" class="moment-image-card">
                  <img :src="image" alt="moment" class="moment-image-preview" />
                  <button type="button" class="admin-mini-btn danger" @click="removeImage(index)">移除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">发布设置</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <label>状态</label>
              <select v-model="form.status" class="admin-select">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>

            <div class="admin-fieldset">
              <p class="admin-help">发布时间会在首次发布时自动写入，前台按时间流展示。</p>
            </div>
          </div>
        </div>
      </aside>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiAdminMoments, apiAdminUpload } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { formatFileSize, optimizeImageFile } from '../../utils/imageUpload.js';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const uploadingImages = ref(false);
const fileInput = ref(null);

const form = ref({
  content: '',
  mood: '',
  images: [],
  status: 'draft',
});

const fetchMoment = async () => {
  if (!isEdit.value) return;

  loading.value = true;
  try {
    const response = await apiAdminMoments.detail(route.params.id);
    const moment = response.data?.moment || response.data?.data?.moment || response.data?.data || response.data;
    form.value = {
      content: moment.content || '',
      mood: moment.mood || '',
      images: Array.isArray(moment.images) ? moment.images : [],
      status: moment.status || 'draft',
    };
  } catch (error) {
    console.error('获取碎碎念失败:', error);
    showToast('获取碎碎念失败', 'error', 3200);
    router.push({ name: 'AdminMoments' });
  } finally {
    loading.value = false;
  }
};

const handleImageSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  uploadingImages.value = true;
  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(`文件 ${file.name} 不是图片`, 'warn');
        continue;
      }
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.82,
      });
      const response = await apiAdminUpload.uploadImage(optimized);
      const url = response.data?.url || response.data?.data?.url || '';
      if (!url) {
        showToast(`图片 ${file.name} 上传成功但未返回 URL`, 'warn');
        continue;
      }
      if (optimized !== file) {
        showToast(`已压缩 ${file.name}：${formatFileSize(file.size)} -> ${formatFileSize(optimized.size)}`, 'success');
      }
      form.value.images = [...form.value.images, url];
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    showToast('上传图片失败', 'error', 3200);
  } finally {
    uploadingImages.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const removeImage = (index) => {
  form.value.images = form.value.images.filter((_, current) => current !== index);
};

const handleSubmit = async () => {
  if (!form.value.content.trim()) {
    showToast('请输入碎碎念内容', 'warn');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      content: form.value.content.trim(),
      mood: form.value.mood.trim(),
      images: form.value.images,
      status: form.value.status,
    };

    if (isEdit.value) {
      await apiAdminMoments.update(route.params.id, payload);
      showToast('更新成功', 'success');
    } else {
      await apiAdminMoments.create(payload);
      showToast('发布成功', 'success');
    }

    router.push({ name: 'AdminMoments' });
  } catch (error) {
    console.error('保存碎碎念失败:', error);
    showToast(error.response?.data?.error || '保存失败', 'error', 3200);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMoment();
});
</script>

<style scoped>
.moment-textarea {
  min-height: 320px;
  line-height: 1.9;
}

.moment-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.moment-image-card {
  display: grid;
  gap: 8px;
}

.moment-image-preview {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--admin-line);
}
</style>
