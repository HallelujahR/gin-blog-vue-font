<template>
  <div class="admin-page-edit">
    <div class="edit-header">
      <h2>{{ isEdit ? '编辑页面' : '创建页面' }}</h2>
      <button @click="$router.back()" class="back-btn">返回</button>
    </div>

    <form @submit.prevent="handleSubmit" class="edit-form">
      <div class="form-group">
        <label>标题 *</label>
        <input v-model="form.title" type="text" required placeholder="请输入页面标题" />
      </div>

      <div class="form-group">
        <label>Slug *</label>
        <input v-model="form.slug" type="text" required placeholder="例如：about-me" />
        <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">
          用于URL标识，建议使用英文和连字符，例如：about-me
        </small>
      </div>

      <div class="form-group">
        <label>摘要</label>
        <textarea v-model="form.excerpt" rows="3" placeholder="请输入页面摘要（可选）"></textarea>
      </div>

      <div class="form-group">
        <label>内容 *</label>
        <div ref="editorContainer" class="quill-editor"></div>
      </div>

      <div class="form-group">
        <label>状态</label>
        <select v-model="form.status" class="select-input">
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '保存中...' : '保存' }}
        </button>
        <button type="button" @click="$router.back()" class="cancel-btn">取消</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiAdminPages } from '../../api/admin.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { showToast } from '../../utils/toast';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const editorContainer = ref(null);
let quillEditor = null;

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
});

// 初始化富文本编辑器
const initEditor = () => {
  if (!editorContainer.value || quillEditor) return;
  
  nextTick(() => {
    quillEditor = new Quill(editorContainer.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image'],
          ['blockquote', 'code-block'],
          ['clean']
        ]
      },
      placeholder: '请输入页面内容...'
    });

    // 监听内容变化
    quillEditor.on('text-change', () => {
      form.value.content = quillEditor.root.innerHTML;
    });

    // 设置初始内容
    if (form.value.content) {
      quillEditor.root.innerHTML = form.value.content;
    }
  });
};

// 设置编辑器内容
const setEditorContent = (html) => {
  if (quillEditor && html) {
    quillEditor.root.innerHTML = html;
    form.value.content = html;
  }
};

// 获取页面详情
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
    
    // 设置编辑器内容
    await nextTick();
    setEditorContent(form.value.content);
  } catch (error) {
    console.error('获取页面失败:', error);
    showToast('获取页面失败: ' + (error.response?.data?.error || error.message || '未知错误'), 'error', 3200);
    router.push({ name: 'AdminPages' });
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!form.value.title || !form.value.slug) {
    showToast('请填写标题和Slug', 'warn');
    return;
  }

  // 获取编辑器内容
  if (quillEditor) {
    form.value.content = quillEditor.root.innerHTML;
  }

  if (!form.value.content || form.value.content.trim() === '' || form.value.content === '<p><br></p>') {
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
    showToast('保存失败: ' + errorMsg, 'error', 3200);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await nextTick();
  initEditor();
  if (isEdit.value) {
    await fetchPage();
  }
});

onBeforeUnmount(() => {
  if (quillEditor) {
    quillEditor = null;
  }
});
</script>

<style scoped>
/* 专业管理端设计 - 统一风格 */
.admin-page-edit {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.edit-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.back-btn {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #334155;
}

.edit-form {
  background: #ffffff;
  border: none;
  border-radius: 0;
  padding: 28px;
  flex: 1;
  overflow-y: auto;
  box-shadow: none;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.form-group input,
.form-group textarea,
.select-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 80px;
}

.form-group input:focus,
.form-group textarea:focus,
.select-input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.submit-btn {
  padding: 10px 20px;
  height: 40px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.submit-btn:hover:not(:disabled) {
  background: #0051D5;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #94a3b8;
}

.cancel-btn {
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.cancel-btn:hover {
  background: #e5e5e7;
}

/* Quill编辑器样式 */
.quill-editor {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  min-height: 500px;
  transition: all 0.2s ease;
}

.quill-editor:hover {
  border-color: #cbd5e1;
}

.quill-editor :deep(.ql-container) {
  font-size: 14px;
  font-family: inherit;
  min-height: 450px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.quill-editor :deep(.ql-toolbar) {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 12px;
}

.quill-editor :deep(.ql-toolbar .ql-stroke) {
  stroke: #475569;
}

.quill-editor :deep(.ql-toolbar .ql-fill) {
  fill: #475569;
}

.quill-editor :deep(.ql-toolbar button:hover),
.quill-editor :deep(.ql-toolbar button.ql-active) {
  background: #e5f0ff;
  border-radius: 4px;
}

.quill-editor :deep(.ql-toolbar .ql-picker-label:hover) {
  color: #007AFF;
}

.quill-editor :deep(.ql-editor) {
  color: #1e293b;
  line-height: 1.8;
  padding: 20px;
}

.quill-editor :deep(.ql-editor.ql-blank::before) {
  color: #94a3b8;
  font-style: normal;
}

.quill-editor :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.quill-editor :deep(.ql-editor pre.ql-syntax) {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: ui-monospace, monospace;
}

.quill-editor :deep(.ql-editor blockquote) {
  border-left: 4px solid #007AFF;
  padding-left: 16px;
  margin: 16px 0;
  color: #64748b;
  font-style: italic;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
}
</style>

