<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">页面编辑</p>
        <h2 class="admin-page-title">{{ isEdit ? '编辑页面' : '新建页面' }}</h2>
      </div>
      <div class="admin-inline-actions">
        <button @click="$router.back()" class="admin-btn admin-btn-ghost">返回</button>
        <button @click="handleSubmit" :disabled="loading" class="admin-btn">{{ loading ? '保存中...' : '保存页面' }}</button>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">Markdown 页面编辑器</span>
        <span class="admin-statline">用于 About 等固定内容页</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">{{ isEdit ? '编辑模式' : '创建模式' }}</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="admin-grid-edit">
      <section class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">页面正文</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <label>标题 *</label>
              <input v-model="form.title" type="text" required placeholder="请输入页面标题" class="admin-input article-title-input" />
            </div>

            <div class="admin-fieldset">
              <label>摘要</label>
              <textarea v-model="form.excerpt" rows="4" placeholder="用于简介或 SEO 的摘要" class="admin-textarea"></textarea>
            </div>

            <div class="admin-fieldset">
              <label>内容（Markdown） *</label>
              <MdEditor
                v-model="form.content"
                class="paper-editor"
                :editorId="editorId"
                :previewTheme="'github'"
                :showCodeRowNumber="true"
                :toolbarsExclude="editorToolbarsExclude"
                :onUploadImg="handleEditorUploadImage"
                :onSave="handleSubmit"
                placeholder="请输入页面内容..."
              />
              <div v-if="uploadingImage" class="admin-help">图片上传中，请稍候...</div>
            </div>
          </div>
        </div>
      </section>

      <aside class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">页面信息</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <label>Slug *</label>
              <input v-model="form.slug" type="text" required placeholder="例如 about-me" class="admin-input" />
              <p class="admin-help">用于 URL 标识，建议只使用英文和连字符。</p>
            </div>

            <div class="admin-fieldset">
              <label>状态</label>
              <select v-model="form.status" class="admin-select">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
          </div>
        </div>
      </aside>
    </form>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MdEditor } from 'md-editor-v3';
import { apiAdminPages, apiAdminUpload } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { formatFileSize, optimizeImageFile } from '../../utils/imageUpload.js';

const route = useRoute();
const router = useRouter();

const editorId = 'page-markdown-editor';
const editorToolbarsExclude = ['github', 'mermaid', 'katex'];
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const uploadingImage = ref(false);

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
});

async function handleEditorUploadImage(files, callback) {
  const list = Array.from(files || []).filter((file) => {
    if (!file.type || !file.type.startsWith('image/')) {
      showToast('仅支持上传图片文件', 'warn');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`图片 ${file.name} 大小超过 5MB，已跳过`, 'warn');
      return false;
    }
    return true;
  });

  if (!list.length) return;

  uploadingImage.value = true;
  try {
    const uploaded = [];
    for (const file of list) {
      const optimizedFile = await optimizeImageFile(file, {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.82,
      });
      const res = await apiAdminUpload.uploadImage(optimizedFile);
      const url = res.data?.url ||
        res.data?.image_url ||
        res.data?.data?.url ||
        res.data?.data?.image_url ||
        res.data?.path ||
        res.data?.data?.path ||
        '';
      if (url) {
        if (optimizedFile !== file) {
          showToast(`已压缩 ${file.name}：${formatFileSize(file.size)} -> ${formatFileSize(optimizedFile.size)}`, 'success');
        }
        uploaded.push({
          url,
          alt: file.name,
          title: file.name,
        });
      } else {
        showToast(`图片 ${file.name} 上传成功但未返回 URL`, 'warn');
      }
    }
    if (uploaded.length) {
      callback(uploaded);
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    showToast('上传图片失败，请稍后重试', 'error', 3200);
  } finally {
    uploadingImage.value = false;
  }
}

const fetchPage = async () => {
  if (!isEdit.value) return;

  loading.value = true;
  try {
    const response = await apiAdminPages.detail(route.params.id);
    const page = response.data?.page || response.data?.data?.page || response.data?.data || response.data;

    if (!page || !page.id) {
      throw new Error('获取的页面数据格式不正确');
    }

    form.value = {
      title: page.title || '',
      slug: page.slug || '',
      excerpt: page.excerpt || '',
      content: page.content || '',
      status: page.status || 'draft',
    };
  } catch (error) {
    console.error('获取页面失败:', error);
    showToast(`获取页面失败: ${error.response?.data?.error || error.message || '未知错误'}`, 'error', 3200);
    router.push({ name: 'AdminPages' });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.value.title || !form.value.slug) {
    showToast('请填写标题和 Slug', 'warn');
    return;
  }
  if (!form.value.content || form.value.content.trim() === '') {
    showToast('请输入页面内容', 'warn');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      title: form.value.title,
      slug: form.value.slug,
      excerpt: form.value.excerpt || '',
      content: form.value.content,
      status: form.value.status || 'draft',
    };

    if (isEdit.value) {
      await apiAdminPages.update(route.params.id, payload);
      showToast('更新成功', 'success');
    } else {
      await apiAdminPages.create(payload);
      showToast('创建成功', 'success');
    }

    router.push({ name: 'AdminPages' });
  } catch (error) {
    console.error('保存失败:', error);
    const errorMsg = error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      '未知错误';
    showToast(`保存失败: ${errorMsg}`, 'error', 3200);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (isEdit.value) {
    await fetchPage();
  }
});
</script>

<style scoped>
.article-title-input {
  font-size: 1.28rem;
  font-weight: 600;
}

:deep(.paper-editor.md-editor) {
  height: 720px;
  border-color: var(--admin-line);
  border-radius: 22px;
  background: rgba(252, 249, 242, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

:deep(.paper-editor .md-editor-toolbar) {
  background: rgba(247, 242, 233, 0.92);
  border-bottom-color: var(--admin-line);
}

:deep(.paper-editor .md-editor-toolbar-item) {
  color: var(--admin-soft-text);
}

:deep(.paper-editor .md-editor-toolbar-item:hover),
:deep(.paper-editor .md-editor-toolbar-item.active) {
  color: var(--admin-accent);
  background: rgba(117, 137, 102, 0.1);
}

:deep(.paper-editor .md-editor-content),
:deep(.paper-editor .md-editor-input-wrapper),
:deep(.paper-editor .md-editor-preview-wrapper),
:deep(.paper-editor .md-editor-preview) {
  background: transparent;
}

:deep(.paper-editor .cm-editor) {
  font-size: 15px;
  line-height: 1.8;
}
</style>
