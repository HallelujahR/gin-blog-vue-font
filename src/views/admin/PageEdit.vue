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
    alert('获取页面失败: ' + (error.response?.data?.error || error.message || '未知错误'));
    router.push({ name: 'AdminPages' });
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!form.value.title || !form.value.slug) {
    alert('请填写标题和Slug');
    return;
  }

  // 获取编辑器内容
  if (quillEditor) {
    form.value.content = quillEditor.root.innerHTML;
  }

  if (!form.value.content || form.value.content.trim() === '' || form.value.content === '<p><br></p>') {
    alert('请输入页面内容');
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
      alert('更新成功');
    } else {
      await apiAdminPages.create(payload);
      alert('创建成功');
    }
    
    router.push({ name: 'AdminPages' });
  } catch (error) {
    console.error('保存失败:', error);
    const errorMsg = error.response?.data?.error || 
                    error.response?.data?.message || 
                    error.message || 
                    '未知错误';
    alert('保存失败: ' + errorMsg);
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
.admin-page-edit {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.edit-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.back-btn {
  background: linear-gradient(95deg, var(--primary-1) 0%, var(--primary-2) 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background .18s;
}

.back-btn:hover {
  filter: brightness(0.92);
}

.edit-form {
  background: #ffffff;
  border: none;
  border-radius: 0;
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  box-shadow: none;
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.form-group input,
.form-group textarea,
.select-input {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid #f1f5f9;
}

.submit-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #94a3b8;
}

.cancel-btn {
  background: linear-gradient(95deg, var(--primary-1) 0%, var(--primary-2) 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background .18s;
}

.cancel-btn:hover {
  filter: brightness(0.92);
}

/* Quill编辑器样式 */
.quill-editor {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  min-height: 400px;
}

.quill-editor :deep(.ql-container) {
  font-size: 14px;
  font-family: inherit;
  min-height: 350px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.quill-editor :deep(.ql-toolbar) {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.quill-editor :deep(.ql-toolbar .ql-stroke) {
  stroke: #475569;
}

.quill-editor :deep(.ql-toolbar .ql-fill) {
  fill: #475569;
}

.quill-editor :deep(.ql-toolbar button:hover),
.quill-editor :deep(.ql-toolbar button.ql-active) {
  background: #e0e7ff;
}

.quill-editor :deep(.ql-toolbar .ql-picker-label:hover) {
  color: #667eea;
}

.quill-editor :deep(.ql-editor) {
  color: #1e293b;
  line-height: 1.8;
  padding: 18px;
}

.quill-editor :deep(.ql-editor.ql-blank::before) {
  color: #94a3b8;
  font-style: normal;
}

.quill-editor :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.quill-editor :deep(.ql-editor pre.ql-syntax) {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.quill-editor :deep(.ql-editor blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 16px 0;
  color: #64748b;
  font-style: italic;
}
</style>

