<template>
  <div class="admin-post-edit">
    <div class="edit-header">
      <h2>{{ isEdit ? '编辑文章' : '创建文章' }}</h2>
      <button @click="$router.back()" class="back-btn">返回</button>
    </div>

    <form @submit.prevent="handleSubmit" class="edit-form">
      <div class="form-group">
        <label>标题 *</label>
        <input v-model="form.title" type="text" required placeholder="请输入文章标题" />
      </div>

      <div class="form-group">
        <label>摘要</label>
        <textarea v-model="form.excerpt" rows="3" placeholder="请输入文章摘要"></textarea>
      </div>

      <div class="form-group">
        <label>内容 *</label>
        <div ref="editorContainer" class="quill-editor"></div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>封面图片</label>
          <input 
            type="file" 
            accept="image/*" 
            @change="handleImageSelect" 
            class="file-input"
            ref="fileInput"
          />
          <div v-if="previewUrl" class="image-preview">
            <img :src="previewUrl" alt="封面预览" class="preview-img" />
            <button 
              type="button" 
              @click="clearImage" 
              class="clear-image-btn"
              v-if="imageFile || form.cover_image"
            >
              清除图片
            </button>
          </div>
          <div v-if="form.cover_image && !previewUrl" class="image-info">
            <span>当前图片URL: {{ form.cover_image }}</span>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>分类 (可多选)</label>
          <div class="checkbox-group">
            <label v-for="cat in categories" :key="cat.id" class="checkbox-item">
              <input type="checkbox" :value="cat.id" v-model="form.category_ids" />
              <span class="checkbox-label">{{ cat.name }}</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>标签 (可多选)</label>
          <div class="checkbox-group">
            <label v-for="tag in tags" :key="tag.id" class="checkbox-item">
              <input type="checkbox" :value="tag.id" v-model="form.tag_ids" />
              <span class="checkbox-label">{{ tag.name }}</span>
            </label>
          </div>
        </div>
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
import { apiAdminPosts, apiAdminCategories, apiAdminTags, apiAdminUpload } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);

const previewUrl = ref('');
const imageFile = ref(null); // 存储选中的文件对象
const fileInput = ref(null);
const editorContainer = ref(null);
let quillEditor = null;

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_ids: [],
  tag_ids: [],
  status: 'draft',
});

// 处理图片选择（仅预览，不上传）
const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      e.target.value = '';
      return;
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      e.target.value = '';
      return;
    }
    
    // 存储文件对象
    imageFile.value = file;
    
    // 生成预览URL（仅用于预览）
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value); // 释放之前的blob URL
    }
    previewUrl.value = URL.createObjectURL(file);
    
    // 注意：这里不设置cover_image，等提交时再上传
  }
};

// 清除图片
const clearImage = () => {
  imageFile.value = null;
  form.value.cover_image = '';
  if (previewUrl.value) {
    if (previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = '';
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const getCategoryName = (id) => {
  const category = categories.value.find(cat => cat.id === id);
  return category ? category.name : '未知分类';
};


const fetchCategories = async () => {
  try {
    const response = await apiMeta.categories();
    // 按名称字母顺序排序
    categories.value = (response.data.categories || response.data || []).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

const fetchTags = async () => {
  try {
    const response = await apiMeta.tags();
    // 按名称字母顺序排序（与分类排序方式一致）
    tags.value = (response.data.tags || response.data || []).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error('获取标签失败:', error);
  }
};

// 初始化富文本编辑器
const initEditor = () => {
  if (!editorContainer.value || quillEditor) return;
  
  quillEditor = new Quill(editorContainer.value, {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ]
    },
    placeholder: '请输入文章内容...',
  });
  
  // 监听编辑器内容变化，同步到form.content
  quillEditor.on('text-change', () => {
    form.value.content = quillEditor.root.innerHTML;
  });
};

// 设置编辑器内容
const setEditorContent = (html) => {
  if (quillEditor && html) {
    quillEditor.root.innerHTML = html;
    form.value.content = html;
  }
};

const fetchPost = async () => {
  if (!isEdit.value) return;
  
  loading.value = true;
  try {
    const response = await apiAdminPosts.detail(route.params.id);
    // 尝试多种可能的响应格式
    const post = response.data?.post || response.data?.data?.post || response.data?.data || response.data;
    
    if (!post || !post.id) {
      throw new Error('获取的文章数据格式不正确');
    }
    
    // 处理分类ID：可能是数组ID，也可能是分类对象数组
    let categoryIds = [];
    if (post.category_ids && Array.isArray(post.category_ids)) {
      categoryIds = post.category_ids;
    } else if (post.categories && Array.isArray(post.categories)) {
      categoryIds = post.categories.map(c => typeof c === 'object' ? c.id : c);
    } else if (post.category_id) {
      categoryIds = [post.category_id];
    }
    
    // 处理标签ID：可能是数组ID，也可能是标签对象数组
    let tagIds = [];
    if (post.tag_ids && Array.isArray(post.tag_ids)) {
      tagIds = post.tag_ids;
    } else if (post.tags && Array.isArray(post.tags)) {
      tagIds = post.tags.map(t => typeof t === 'object' ? t.id : t);
    }
    
    form.value = {
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      category_ids: categoryIds,
      tag_ids: tagIds,
      status: post.status || post.published ? 'published' : 'draft',
    };
    
    // 设置编辑器内容
    await nextTick();
    if (form.value.content) {
      setEditorContent(form.value.content);
    }
    
    // 设置预览图（已有图片URL，不是文件）
    if (post.cover_image) {
      previewUrl.value = post.cover_image;
      imageFile.value = null; // 编辑模式下，清空文件对象
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    alert('获取文章失败: ' + (error.response?.data?.error || error.message || '未知错误'));
    router.push({ name: 'AdminPosts' });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  // 确保从编辑器获取最新内容
  if (quillEditor) {
    form.value.content = quillEditor.root.innerHTML;
  }
  
  if (!form.value.title || !form.value.content || form.value.content.trim() === '') {
    alert('请填写标题和内容');
    return;
  }

  loading.value = true;

  try {
    // 构建提交数据
    const payload = {
      title: form.value.title,
      excerpt: form.value.excerpt || '',
      content: form.value.content,
      cover_image: form.value.cover_image || '', // 已有图片URL（如果有）
      category_ids: form.value.category_ids.map(id => Number(id)),
      tag_ids: form.value.tag_ids.map(id => Number(id)),
      status: form.value.status || 'draft',
    };

    // 判断是否有新选择的图片文件
    const hasNewImage = imageFile.value !== null;

    // 提交文章数据
    // 如果有新图片文件，将文件作为FormData的一部分直接提交
    // 如果没有新图片但有cover_image URL，使用JSON提交
    if (isEdit.value) {
      const response = await apiAdminPosts.update(
        route.params.id, 
        payload, 
        hasNewImage ? imageFile.value : null
      );
      
      // 如果后端返回了图片URL，更新预览
      if (hasNewImage && response.data) {
        const returnedUrl = response.data?.cover_image || 
                           response.data?.data?.cover_image ||
                           response.data?.post?.cover_image;
        if (returnedUrl) {
          // 释放预览用的blob URL
          if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl.value);
          }
          previewUrl.value = returnedUrl;
          form.value.cover_image = returnedUrl;
        }
      }
      alert('更新成功');
    } else {
      const response = await apiAdminPosts.create(
        payload, 
        hasNewImage ? imageFile.value : null
      );
      
      // 如果后端返回了图片URL，更新预览
      if (hasNewImage && response.data) {
        const returnedUrl = response.data?.cover_image || 
                           response.data?.data?.cover_image ||
                           response.data?.post?.cover_image;
        if (returnedUrl) {
          // 释放预览用的blob URL
          if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl.value);
          }
          previewUrl.value = returnedUrl;
          form.value.cover_image = returnedUrl;
        }
      }
      alert('创建成功');
    }
    
    router.push({ name: 'AdminPosts' });
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
  await Promise.all([fetchCategories(), fetchTags()]);
  
  // 初始化编辑器
  await nextTick();
  initEditor();
  
  if (isEdit.value) {
    await fetchPost();
  }
});

// 组件销毁时清理编辑器
onBeforeUnmount(() => {
  if (quillEditor) {
    quillEditor = null;
  }
});
</script>

<style scoped>
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-post-edit {
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
  margin-top: 8px;
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
  font-family: monospace;
}

.form-group input:focus,
.form-group textarea:focus,
.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 富文本编辑器样式 */
.quill-editor {
  min-height: 400px;
  background: #ffffff;
}

.quill-editor :deep(.ql-container) {
  min-height: 400px;
  font-size: 15px;
  color: #1e293b;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  border: 1px solid #e2e8f0;
  border-top: none;
}

.quill-editor :deep(.ql-toolbar) {
  border: 1px solid #e2e8f0;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
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
  background: #e0e7ff;
  border-radius: 4px;
}

.quill-editor :deep(.ql-toolbar .ql-picker-label:hover) {
  color: #667eea;
}

.quill-editor :deep(.ql-editor) {
  padding: 18px;
  line-height: 1.6;
}

.quill-editor :deep(.ql-editor.ql-blank::before) {
  color: #94a3b8;
  font-style: normal;
}

.quill-editor :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
}

.quill-editor :deep(.ql-editor pre.ql-syntax) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  color: #1e293b;
}

.quill-editor :deep(.ql-editor blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 16px 0;
  color: #64748b;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.tags-select {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.tag-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
}

.tag-checkbox input {
  width: auto;
  margin: 0;
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

/* 图片预览样式 */
.image-preview {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  background: #f8fafc;
  position: relative;
}

.preview-img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  margin-bottom: 12px;
}

.clear-image-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

.clear-image-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.image-info {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  word-break: break-all;
}

.file-input {
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
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
  margin-top: 8px;
}

.cancel-btn:hover {
  filter: brightness(0.92);
}

/* 分类选择器样式 */
.checkbox-group {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  background: #f8fafc;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  margin-right: 12px;
  margin-bottom: 12px;
}

.checkbox-item:hover {
  background: #f0f4ff;
  border-color: #c9d3f0;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.checkbox-label {
  user-select: none;
}


</style>

