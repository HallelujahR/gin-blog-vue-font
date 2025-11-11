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
        <label>内容（Markdown） *</label>
        <v-md-editor
          v-model="form.content"
          :height="editorHeight"
          :left-toolbar="leftToolbar"
          :right-toolbar="rightToolbar"
          :config="editorConfig"
          :mode="editorMode"
          autofocus
          @save="handleSubmit"
          @fullscreen-change="onEditorFullscreenChange"
        />
        <div v-if="uploadingImage" class="md-uploading-tip">图片上传中，请稍候...</div>
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
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiAdminPosts, apiAdminUpload } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);

const previewUrl = ref('');
const imageFile = ref(null); // 存储选中的文件对象
const fileInput = ref(null);

const isEditorFullscreen = ref(false);
const editorMode = ref('editable-preview'); // auto switch if fenced code block unclosed
const uploadingImage = ref(false);

const leftToolbar = 'undo redo clear | h bold italic strikethrough quote | ul ol todo-list table | link image code | save preview toc sync-scroll fullscreen | html2md';
const rightToolbar = 'preview toc sync-scroll fullscreen';
const editorHeight = computed(() => (isEditorFullscreen.value ? '100%' : '560px'));

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_ids: [],
  tag_ids: [],
  status: 'draft',
});

const editorConfig = {
  uploadImg: {
    async handler(files) {
      const validFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert('仅支持上传图片文件');
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`图片 ${file.name} 大小超过 5MB，已跳过`);
          return false;
        }
        return true;
      });

      if (!validFiles.length) return [];

      uploadingImage.value = true;
      try {
        const urls = [];
        for (const file of validFiles) {
          const res = await apiAdminUpload.uploadImage(file);
          const url = res.data?.url ||
                      res.data?.image_url ||
                      res.data?.data?.url ||
                      res.data?.data?.image_url ||
                      res.data?.path ||
                      '';
          if (url) {
            urls.push(url);
          } else {
            alert(`图片 ${file.name} 上传成功但未返回 URL`);
          }
        }
        return urls;
      } catch (error) {
        console.error('上传图片失败', error);
        alert('上传图片失败，请稍后重试');
        return [];
      } finally {
        uploadingImage.value = false;
      }
    },
  },
  toolbar: {
    html2md: {
      title: 'HTML 转 Markdown',
      icon: 'v-md-icon-tip',
      action(editor) {
        try {
          // 延迟拿到当前文本
          setTimeout(async () => {
            const Turndown = (await import('turndown')).default;
            const td = new Turndown({
              headingStyle: 'atx',
              codeBlockStyle: 'fenced'
            });
            const html = form.value.content || '';
            if (!html || !/<[a-z][\s\S]*>/i.test(html)) {
              alert('当前内容不是 HTML，或为空');
              return;
            }
            const mdText = td.turndown(html);
            form.value.content = mdText;
          });
        } catch (e) {
          console.error('HTML 转换失败', e);
          alert('HTML 转 Markdown 失败，请稍后重试');
        }
      }
    }
  }
};

// 处理图片选择（仅预览，不上传）
const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'warn');
      e.target.value = '';
      return;
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过5MB', 'warn');
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
    
    // 设置预览图（已有图片URL，不是文件）
    if (post.cover_image) {
      previewUrl.value = post.cover_image;
      imageFile.value = null; // 编辑模式下，清空文件对象
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    showToast('获取文章失败: ' + (error.response?.data?.error || error.message || '未知错误'), 'error', 3000);
    router.push({ name: 'AdminPosts' });
  } finally {
    loading.value = false;
  }
};

const onEditorFullscreenChange = (val) => {
  isEditorFullscreen.value = val;
};

let saving = false;
const handleSubmit = async () => {
  if (saving || loading.value) return;
  // Markdown 模式下直接使用 form.content
  
  if (!form.value.title || !form.value.content || form.value.content.trim() === '') {
    showToast('请填写标题和内容', 'warn');
    return;
  }

  loading.value = true;
  saving = true;

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
      showToast('更新成功', 'success');
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
      showToast('创建成功', 'success');
    }
    
    await router.push({ name: 'AdminPosts' });
  } catch (error) {
    console.error('保存失败:', error);
    const errorMsg = error.response?.data?.error || 
                    error.response?.data?.message || 
                    error.message || 
                    '未知错误';
    showToast('保存失败: ' + errorMsg, 'error', 3200);
  } finally {
    loading.value = false;
    saving = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTags()]);

  if (isEdit.value) {
    await fetchPost();
  }
  await nextTick();
  // Enable Tab indentation inside editor textarea
  const root = document.querySelector('.v-md-editor');
  if (root) {
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const target = e.target;
        if (target && target.tagName === 'TEXTAREA') {
          e.preventDefault();
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const val = target.value;
          const indent = '  '; // two spaces
          target.value = val.slice(0, start) + indent + val.slice(end);
          target.selectionStart = target.selectionEnd = start + indent.length;
          // 同步到 v-model
          form.value.content = target.value;
        }
      }
    }, true);
  }
});

// When user is typing an unclosed fenced code block like ```js ...,
// disable live preview to avoid rendering glitches that may freeze editing
watch(() => form.value.content, (val = '') => {
  // count occurrences of ```
  const fenceMatches = val.match(/(^|\n)```/g);
  const count = fenceMatches ? fenceMatches.length : 0;
  const hasUnclosedFence = count % 2 === 1;
  editorMode.value = hasUnclosedFence ? 'edit' : 'editable-preview';
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

.md-uploading-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

:deep(.v-md-editor) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  background: #ffffff;
}
:deep(.v-md-editor__toolbar) {
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
:deep(.v-md-editor__toolbar .v-md-editor__toolbar-item) {
  color: #111827;
}
:deep(.v-md-editor__toolbar .v-md-editor__toolbar-item:hover) {
  background: #eef2ff;
  color: #4338ca;
}
:deep(.v-md-editor__editor-wrapper),
:deep(.v-md-editor__main),
:deep(.v-md-editor__preview) {
  background: #ffffff;
}
:deep(.v-md-editor__editor-wrapper pre) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
:deep(.v-md-editor-preview code),
:deep(.v-md-editor__preview code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}
:deep(.v-md-editor-preview pre),
:deep(.v-md-editor__preview pre) {
  background: #0d1117;
  color: #c9d1d9;
  padding: 16px;
  border-radius: 10px;
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

