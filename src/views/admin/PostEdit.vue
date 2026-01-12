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
          :disabled-menus="[]"
          @upload-image="onEditorUploadImage"
          :mode="editorMode"
          autofocus
          @save="handleSubmit"
          @fullscreen-change="onEditorFullscreenChange"
        />
        <input ref="toolbarImageInput" type="file" accept="image/*" style="display:none" @change="onToolbarImageSelect">
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
            <label 
              v-for="cat in categories" 
              :key="cat.id" 
              :class="['checkbox-item', { 'checkbox-item-checked': form.category_ids.includes(cat.id) }]"
            >
              <input type="checkbox" :value="cat.id" v-model="form.category_ids" />
              <span class="checkbox-label">{{ cat.name }}</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>标签 (可多选)</label>
          <div class="checkbox-group">
            <label 
              v-for="tag in tags" 
              :key="tag.id" 
              :class="['checkbox-item', { 'checkbox-item-checked': form.tag_ids.includes(tag.id) }]"
            >
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

const leftToolbar = 'undo redo clear | h bold italic strikethrough quote | ul ol todo-list table | link image code | save preview toc sync-scroll fullscreen | html2md localImage';
const rightToolbar = 'preview toc sync-scroll fullscreen';
const editorHeight = computed(() => (isEditorFullscreen.value ? '100%' : '600px'));

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
  // 优化编辑器性能配置
  preview: {
    delay: 500, // 延迟预览，减少卡顿
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
              showToast('当前内容不是 HTML，或为空', 'warn');
              return;
            }
            const mdText = td.turndown(html);
            form.value.content = mdText;
          });
        } catch (e) {
          console.error('HTML 转换失败', e);
          showToast('HTML 转 Markdown 失败，请稍后重试', 'error', 3200);
        }
      }
    },
    localImage: {
      title: '上传本地图片',
      icon: 'v-md-icon-image',
      action(editor) {
        pendingEditor.value = editor;
        if (toolbarImageInput.value) {
          toolbarImageInput.value.value = '';
          toolbarImageInput.value.click();
        } else {
          showToast('无法打开文件选择器', 'error');
        }
      }
    }
  }
};

// v-md-editor 的上传钩子（作为组件属性传入）
async function uploadImageHandler(files, insertImage, onError) {
  const list = Array.from(files || []);
  if (!list.length) return [];
  const validFiles = list.filter((file) => {
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
                  res.data?.data?.path ||
                  '';
      if (url) {
        urls.push(url);
        if (typeof insertImage === 'function') {
          insertImage({ url, desc: file.name });
        }
      } else {
        showToast(`图片 ${file.name} 上传成功但未返回 URL`, 'warn');
      }
    }
    return urls;
  } catch (error) {
    console.error('上传图片失败', error);
    if (typeof onError === 'function') onError(error);
    showToast('上传图片失败，请稍后重试', 'error', 3200);
    return [];
  } finally {
    uploadingImage.value = false;
  }
}

// v-md-editor 文档风格事件：@upload-image="(event, insertImage, files) => {}"
function onEditorUploadImage(event, insertImage, files) {
  // 兼容不同调用方，复用同一实现
  return uploadImageHandler(files, insertImage);
}

const toolbarImageInput = ref(null);
const pendingEditor = ref(null);
async function onToolbarImageSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    showToast('仅支持上传图片文件', 'warn');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast(`图片 ${file.name} 大小超过 5MB，已跳过`, 'warn');
    return;
  }
  uploadingImage.value = true;
  try {
    const res = await apiAdminUpload.uploadImage(file);
    const url = res.data?.url ||
                res.data?.image_url ||
                res.data?.data?.url ||
                res.data?.data?.image_url ||
                res.data?.path ||
                res.data?.data?.path ||
                '';
    if (!url) {
      showToast('上传成功但未返回 URL', 'warn');
      return;
    }
    // 优先使用编辑器实例插入（v-md-editor 官方方式）
    if (pendingEditor.value && typeof pendingEditor.value.insert === 'function') {
      pendingEditor.value.insert(() => ({
        text: `![${file.name}](${url})`
      }));
    } else {
      // 回退：直接在光标处插入
      form.value.content = (form.value.content || '') + `\n\n![${file.name}](${url})\n`;
    }
    showToast('图片已插入', 'success');
  } catch (error) {
    console.error('上传图片失败', error);
    showToast('上传图片失败，请稍后重试', 'error', 3200);
  } finally {
    uploadingImage.value = false;
    pendingEditor.value = null;
  }
}

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

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// When user is typing an unclosed fenced code block like ```js ...,
// disable live preview to avoid rendering glitches that may freeze editing
// 使用防抖优化性能，减少卡顿
const updateEditorMode = debounce((val = '') => {
  // count occurrences of ```
  const fenceMatches = val.match(/(^|\n)```/g);
  const count = fenceMatches ? fenceMatches.length : 0;
  const hasUnclosedFence = count % 2 === 1;
  editorMode.value = hasUnclosedFence ? 'edit' : 'editable-preview';
}, 300);

watch(() => form.value.content, (val = '') => {
  updateEditorMode(val);
}, { immediate: false });
</script>

<style scoped>
/* 专业管理端设计 - 统一风格 */
.admin-post-edit {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 0 40px;
  height: 80px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #ffffff;
  box-sizing: border-box;
}

.edit-header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.back-btn {
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
  border-radius: 980px;
  padding: 8px 16px;
  height: 32px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.back-btn:hover {
  background: #e5e5e7;
  transform: translateY(-1px);
}

.edit-form {
  background: #ffffff;
  border: none;
  border-radius: 0;
  padding: 32px 40px;
  flex: 1;
  overflow-y: auto;
  box-shadow: none;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

.form-group input,
.form-group textarea,
.select-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.md-uploading-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #86868b;
  font-style: italic;
}

:deep(.v-md-editor) {
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-md-editor:hover) {
  border-color: #a1a1a6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

:deep(.v-md-editor__toolbar) {
  background: #fbfbfd;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 8px 12px;
}

:deep(.v-md-editor__toolbar .v-md-editor__toolbar-item) {
  color: #86868b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  margin: 0 2px;
}

:deep(.v-md-editor__toolbar .v-md-editor__toolbar-item:hover) {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

:deep(.v-md-editor__toolbar .v-md-editor__toolbar-item.active) {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

:deep(.v-md-editor__editor-wrapper),
:deep(.v-md-editor__main),
:deep(.v-md-editor__preview) {
  background: #ffffff;
}

:deep(.v-md-editor__editor-wrapper textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 20px;
  color: #1d1d1f;
}

:deep(.v-md-editor__editor-wrapper pre) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.v-md-editor-preview code),
:deep(.v-md-editor__preview code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #dc2626;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

:deep(.v-md-editor-preview pre),
:deep(.v-md-editor__preview pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.6;
}

:deep(.v-md-editor-preview pre code),
:deep(.v-md-editor__preview pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

:deep(.v-md-editor__preview) {
  padding: 20px;
  line-height: 1.8;
  color: #1d1d1f;
}

:deep(.v-md-editor__preview h1),
:deep(.v-md-editor__preview h2),
:deep(.v-md-editor__preview h3),
:deep(.v-md-editor__preview h4),
:deep(.v-md-editor__preview h5),
:deep(.v-md-editor__preview h6) {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 700;
  color: #1d1d1f;
}

:deep(.v-md-editor__preview p) {
  margin-bottom: 16px;
}

:deep(.v-md-editor__preview a) {
  color: #0071e3;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-md-editor__preview a:hover) {
  border-bottom-color: #0071e3;
}

:deep(.v-md-editor__preview blockquote) {
  border-left: 4px solid #0071e3;
  padding-left: 16px;
  margin: 16px 0;
  color: #86868b;
  font-style: italic;
  background: #fbfbfd;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

:deep(.v-md-editor__preview table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

:deep(.v-md-editor__preview table th),
:deep(.v-md-editor__preview table td) {
  border: 1px solid #e2e8f0;
  padding: 12px;
  text-align: left;
}

:deep(.v-md-editor__preview table th) {
  background: #fbfbfd;
  font-weight: 600;
  color: #86868b;
}

/* 优化同步滚动 */
:deep(.v-md-editor__editor-wrapper),
:deep(.v-md-editor__preview) {
  overflow-y: auto;
  scroll-behavior: smooth;
}

:deep(.v-md-editor__editor-wrapper::-webkit-scrollbar),
:deep(.v-md-editor__preview::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.v-md-editor__editor-wrapper::-webkit-scrollbar-track),
:deep(.v-md-editor__preview::-webkit-scrollbar-track) {
  background: #f5f5f7;
  border-radius: 4px;
}

:deep(.v-md-editor__editor-wrapper::-webkit-scrollbar-thumb),
:deep(.v-md-editor__preview::-webkit-scrollbar-thumb) {
  background: #d2d2d7;
  border-radius: 4px;
}

:deep(.v-md-editor__editor-wrapper::-webkit-scrollbar-thumb:hover),
:deep(.v-md-editor__preview::-webkit-scrollbar-thumb:hover) {
  background: #a1a1a6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  
  .edit-form {
    padding: 24px 20px;
  }
  
  .edit-header {
    padding: 0 20px;
  }
}

.tags-select {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.submit-btn {
  padding: 8px 20px;
  height: 36px;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.submit-btn:hover:not(:disabled) {
  background: #0077ed;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #86868b;
  transform: none;
}

/* 图片预览样式 */
.image-preview {
  margin-top: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 16px;
  background: #fbfbfd;
  position: relative;
}

.preview-img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.clear-image-btn {
  padding: 6px 14px;
  height: 28px;
  background: #ff3b30;
  color: #fff;
  border: none;
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.clear-image-btn:hover {
  background: #d70015;
  transform: translateY(-1px);
}

.image-info {
  margin-top: 12px;
  padding: 12px;
  background: #fbfbfd;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #86868b;
  word-break: break-all;
  font-family: ui-monospace, monospace;
}

.file-input {
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  border: 1px solid #d2d2d7;
  background: #ffffff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-input:hover {
  border-color: #a1a1a6;
}

.cancel-btn {
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
  border-radius: 980px;
  padding: 8px 20px;
  height: 36px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.cancel-btn:hover {
  background: #e5e5e7;
  transform: translateY(-1px);
}

/* 分类选择器样式 */
.checkbox-group {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 16px;
  background: #fbfbfd;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
}

.checkbox-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 400;
  background: #ffffff;
  padding: 6px 14px;
  border-radius: 980px;
  border: 1px solid #d2d2d7;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkbox-item:hover {
  background: rgba(0, 113, 227, 0.08);
  border-color: #0071e3;
}

.checkbox-item input[type="checkbox"]:checked + .checkbox-label {
  color: #0071e3;
  font-weight: 500;
}

.checkbox-item-checked {
  background: rgba(0, 113, 227, 0.1) !important;
  border-color: #0071e3 !important;
}

.checkbox-item-checked .checkbox-label {
  color: #0071e3;
  font-weight: 500;
}

.checkbox-item input[type="checkbox"]:checked {
  accent-color: #0071e3;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  accent-color: #0071e3;
  cursor: pointer;
  margin: 0;
}

.checkbox-label {
  user-select: none;
  cursor: pointer;
  transition: color 0.2s ease;
}


</style>

