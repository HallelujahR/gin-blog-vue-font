<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">内容编辑</p>
        <h2 class="admin-page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      </div>
      <div class="admin-inline-actions">
        <button @click="$router.back()" class="admin-btn admin-btn-ghost">返回</button>
        <button @click="handleSubmit" :disabled="loading" class="admin-btn">{{ loading ? '保存中...' : '保存文章' }}</button>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">Markdown 编辑器</span>
        <span class="admin-statline">支持图片上传、实时预览与全文排版</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">{{ isEdit ? '编辑模式' : '创建模式' }}</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="admin-grid-edit">
      <section class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">正文</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <label>标题 *</label>
              <input v-model="form.title" type="text" required placeholder="请输入文章标题" class="admin-input article-title-input" />
            </div>

            <div class="admin-fieldset">
              <label>摘要</label>
              <textarea v-model="form.excerpt" rows="4" placeholder="用于列表和搜索的摘要内容" class="admin-textarea"></textarea>
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
                placeholder="开始写作..."
              />
              <div v-if="uploadingImage" class="admin-help">图片上传中，请稍候...</div>
            </div>
          </div>
        </div>
      </section>

      <aside class="admin-stack">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">发布信息</h3>
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
              <label>封面图片</label>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageSelect"
                class="admin-input"
              />
              <div v-if="previewUrl" class="cover-preview">
                <img :src="previewUrl" alt="封面预览" class="cover-preview-image" />
                <button type="button" @click="clearImage" class="admin-mini-btn danger" v-if="imageFile || form.cover_image">
                  清除图片
                </button>
              </div>
              <div v-else-if="form.cover_image" class="admin-help">当前封面：{{ form.cover_image }}</div>
            </div>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel-head">
            <h3 class="admin-panel-title">分类与标签</h3>
          </div>
          <div class="admin-panel-body admin-stack">
            <div class="admin-fieldset">
              <div class="tax-label-row">
                <label>智能推荐</label>
                <button
                  type="button"
                  class="admin-mini-btn"
                  :disabled="suggestingTaxonomy"
                  @click="requestTaxonomySuggestions()"
                >
                  {{ suggestingTaxonomy ? '分析中...' : '刷新推荐' }}
                </button>
              </div>
              <div class="taxonomy-recommend-panel">
                <p class="taxonomy-recommend-copy">
                  根据标题、摘要和正文给出推荐，你点选后才会加入分类或标签。
                </p>
                <p v-if="taxonomyHint" class="admin-help taxonomy-hint">{{ taxonomyHint }}</p>

                <div class="taxonomy-recommend-group">
                  <div class="taxonomy-recommend-head">
                    <span>推荐分类</span>
                    <span class="taxonomy-recommend-meta">{{ taxonomySuggestions.categories.length }} 项</span>
                  </div>
                  <div v-if="taxonomySuggestions.categories.length" class="taxonomy-suggestion-list">
                    <button
                      v-for="item in taxonomySuggestions.categories"
                      :key="`category-suggestion-${item.id}`"
                      type="button"
                      class="taxonomy-suggestion-chip"
                      :class="{ active: form.category_ids.includes(item.id) }"
                      @click="toggleCategory(item.id)"
                    >
                      <span class="taxonomy-suggestion-title">{{ item.name }}</span>
                      <span class="taxonomy-suggestion-score">匹配 {{ item.score }}</span>
                      <span v-if="item.matched_keywords?.length" class="taxonomy-suggestion-keywords">
                        {{ item.matched_keywords.slice(0, 3).join(' / ') }}
                      </span>
                    </button>
                  </div>
                  <div v-else class="admin-help">还没有推荐分类，写得更具体一些会更容易命中。</div>
                </div>

                <div class="taxonomy-recommend-group">
                  <div class="taxonomy-recommend-head">
                    <span>推荐标签</span>
                    <span class="taxonomy-recommend-meta">{{ taxonomySuggestions.tags.length }} 项</span>
                  </div>
                  <div v-if="taxonomySuggestions.tags.length" class="taxonomy-suggestion-list">
                    <button
                      v-for="item in taxonomySuggestions.tags"
                      :key="`tag-suggestion-${item.id}`"
                      type="button"
                      class="taxonomy-suggestion-chip"
                      :class="{ active: form.tag_ids.includes(item.id) }"
                      @click="toggleTag(item.id)"
                    >
                      <span class="taxonomy-suggestion-title">{{ item.name }}</span>
                      <span class="taxonomy-suggestion-score">匹配 {{ item.score }}</span>
                      <span v-if="item.matched_keywords?.length" class="taxonomy-suggestion-keywords">
                        {{ item.matched_keywords.slice(0, 3).join(' / ') }}
                      </span>
                    </button>
                  </div>
                  <div v-else class="admin-help">还没有推荐标签，稍后可以点击“刷新推荐”再试一次。</div>
                </div>
              </div>
            </div>

            <div class="admin-fieldset">
              <label>分类</label>
              <div class="tax-selector">
                <input
                  v-model.trim="categoryKeyword"
                  type="text"
                  class="admin-input tax-search"
                  placeholder="搜索分类"
                />
                <div v-if="selectedCategories.length" class="selected-tax-list">
                  <button
                    v-for="cat in selectedCategories"
                    :key="cat.id"
                    type="button"
                    class="selected-tax-chip"
                    @click="toggleCategory(cat.id)"
                  >
                    <span>{{ cat.name }}</span>
                    <span class="selected-tax-remove">×</span>
                  </button>
                </div>
                <div class="admin-choice-grid compact">
                  <button
                    v-for="cat in filteredCategories"
                    :key="cat.id"
                    type="button"
                    class="admin-choice admin-choice-button"
                    :class="{ selected: form.category_ids.includes(cat.id) }"
                    @click="toggleCategory(cat.id)"
                  >
                    <span>{{ cat.name }}</span>
                  </button>
                </div>
                <div v-if="!filteredCategories.length" class="admin-help">没有匹配的分类</div>
              </div>
            </div>

            <div class="admin-fieldset">
              <label>标签</label>
              <div class="tax-selector">
                <input
                  v-model.trim="tagKeyword"
                  type="text"
                  class="admin-input tax-search"
                  placeholder="搜索标签"
                />
                <div v-if="selectedTags.length" class="selected-tax-list">
                  <button
                    v-for="tag in selectedTags"
                    :key="tag.id"
                    type="button"
                    class="selected-tax-chip"
                    @click="toggleTag(tag.id)"
                  >
                    <span>{{ tag.name }}</span>
                    <span class="selected-tax-remove">×</span>
                  </button>
                </div>
                <div class="admin-choice-grid compact">
                  <button
                    v-for="tag in filteredTags"
                    :key="tag.id"
                    type="button"
                    class="admin-choice admin-choice-button"
                    :class="{ selected: form.tag_ids.includes(tag.id) }"
                    @click="toggleTag(tag.id)"
                  >
                    <span>{{ tag.name }}</span>
                  </button>
                </div>
                <div v-if="!filteredTags.length" class="admin-help">没有匹配的标签</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </form>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { apiAdminPosts, apiAdminUpload } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';
import { formatFileSize, optimizeImageFile } from '../../utils/imageUpload.js';

const route = useRoute();
const router = useRouter();

const editorId = 'post-markdown-editor';
const editorToolbarsExclude = ['github', 'mermaid', 'katex'];
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);
const categoryKeyword = ref('');
const tagKeyword = ref('');
const previewUrl = ref('');
const imageFile = ref(null);
const fileInput = ref(null);
const uploadingImage = ref(false);
const suggestingTaxonomy = ref(false);
const taxonomyHint = ref('输入标题和正文后会自动刷新推荐，也可以手动点击“刷新推荐”。');
const taxonomySuggestions = ref({
  categories: [],
  tags: [],
});
let suggestTimer = null;

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_ids: [],
  tag_ids: [],
  status: 'draft',
});

const normalizedIncludes = (target, keyword) => target.toLowerCase().includes(keyword.toLowerCase());
const hasSuggestionInput = computed(() => {
  const titleLength = form.value.title.trim().length;
  const excerptLength = form.value.excerpt.trim().length;
  const contentLength = form.value.content.trim().length;
  return titleLength >= 4 || excerptLength >= 8 || contentLength >= 24;
});

const filteredCategories = computed(() => {
  const keyword = categoryKeyword.value.trim();
  if (!keyword) return categories.value;
  return categories.value.filter((item) =>
    normalizedIncludes(item.name || '', keyword) || normalizedIncludes(item.slug || '', keyword)
  );
});

const filteredTags = computed(() => {
  const keyword = tagKeyword.value.trim();
  if (!keyword) return tags.value;
  return tags.value.filter((item) =>
    normalizedIncludes(item.name || '', keyword) || normalizedIncludes(item.slug || '', keyword)
  );
});

const selectedCategories = computed(() =>
  categories.value.filter((item) => form.value.category_ids.includes(item.id))
);

const selectedTags = computed(() =>
  tags.value.filter((item) => form.value.tag_ids.includes(item.id))
);

const toggleSelection = (list, id) => {
  const next = list.includes(id)
    ? list.filter((item) => item !== id)
    : [...list, id];
  return next;
};

const toggleCategory = (id) => {
  form.value.category_ids = toggleSelection(form.value.category_ids, id);
};

const toggleTag = (id) => {
  form.value.tag_ids = toggleSelection(form.value.tag_ids, id);
};

const requestTaxonomySuggestions = async ({ silent = false } = {}) => {
  if (!hasSuggestionInput.value) {
    taxonomySuggestions.value = { categories: [], tags: [] };
    taxonomyHint.value = '标题至少 4 个字，或正文至少 24 个字后再推荐会更准确。';
    return;
  }

  suggestingTaxonomy.value = true;
  try {
    const response = await apiAdminPosts.suggestTaxonomy({
      title: form.value.title,
      excerpt: form.value.excerpt,
      content: form.value.content,
    });
    const suggestions = response.data?.suggestions || response.data?.data?.suggestions || response.data?.data || response.data || {};
    taxonomySuggestions.value = {
      categories: Array.isArray(suggestions.categories) ? suggestions.categories : [],
      tags: Array.isArray(suggestions.tags) ? suggestions.tags : [],
    };

    const categoryCount = taxonomySuggestions.value.categories.length;
    const tagCount = taxonomySuggestions.value.tags.length;
    taxonomyHint.value = `已生成 ${categoryCount} 个分类推荐和 ${tagCount} 个标签推荐，点一下才会加入已选项。`;
  } catch (error) {
    console.error('获取分类标签推荐失败:', error);
    taxonomySuggestions.value = { categories: [], tags: [] };
    taxonomyHint.value = '推荐暂时不可用，你仍然可以手动选择分类和标签。';
    if (!silent) {
      showToast('获取分类标签推荐失败', 'warn');
    }
  } finally {
    suggestingTaxonomy.value = false;
  }
};

const scheduleSuggestionRefresh = () => {
  if (suggestTimer) {
    clearTimeout(suggestTimer);
  }

  suggestTimer = window.setTimeout(() => {
    requestTaxonomySuggestions({ silent: true });
  }, 900);
};

async function uploadImages(files = []) {
  const validFiles = Array.from(files).filter((file) => {
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
    const uploaded = [];
    for (const file of validFiles) {
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
    return uploaded;
  } catch (error) {
    console.error('上传图片失败', error);
    showToast('上传图片失败，请稍后重试', 'error', 3200);
    return [];
  } finally {
    uploadingImage.value = false;
  }
}

async function handleEditorUploadImage(files, callback) {
  const uploaded = await uploadImages(files);
  if (uploaded.length) {
    callback(uploaded);
  }
}

async function setCoverFile(file, originalFile = file) {
  const optimizedFile = await optimizeImageFile(file, {
    maxWidth: 1440,
    maxHeight: 960,
    quality: 0.8,
  });
  imageFile.value = optimizedFile;
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = URL.createObjectURL(optimizedFile);

  if (optimizedFile !== originalFile) {
    showToast(`封面已优化：${formatFileSize(originalFile.size)} -> ${formatFileSize(optimizedFile.size)}`, 'success');
  }
}

const handleImageSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'warn');
    e.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB', 'warn');
    e.target.value = '';
    return;
  }

  try {
    await setCoverFile(file);
  } catch (error) {
    console.error('封面优化失败', error);
    showToast('封面优化失败，已使用原图', 'warn');
    imageFile.value = file;
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
  }
};

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
    categories.value = (response.data.categories || response.data || []).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

const fetchTags = async () => {
  try {
    const response = await apiMeta.tags();
    tags.value = (response.data.tags || response.data || []).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('获取标签失败:', error);
  }
};

const fetchPost = async () => {
  if (!isEdit.value) return;

  loading.value = true;
  try {
    const response = await apiAdminPosts.detail(route.params.id);
    const post = response.data?.post || response.data?.data?.post || response.data?.data || response.data;

    if (!post || !post.id) {
      throw new Error('获取的文章数据格式不正确');
    }

    let categoryIds = [];
    if (post.category_ids && Array.isArray(post.category_ids)) {
      categoryIds = post.category_ids;
    } else if (post.categories && Array.isArray(post.categories)) {
      categoryIds = post.categories.map((c) => (typeof c === 'object' ? c.id : c));
    } else if (post.category_id) {
      categoryIds = [post.category_id];
    }

    let tagIds = [];
    if (post.tag_ids && Array.isArray(post.tag_ids)) {
      tagIds = post.tag_ids;
    } else if (post.tags && Array.isArray(post.tags)) {
      tagIds = post.tags.map((t) => (typeof t === 'object' ? t.id : t));
    }

    form.value = {
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      category_ids: categoryIds,
      tag_ids: tagIds,
      status: post.status || (post.published ? 'published' : 'draft'),
    };

    if (post.cover_image) {
      previewUrl.value = post.cover_image;
      imageFile.value = null;
    }

    if (hasSuggestionInput.value) {
      await requestTaxonomySuggestions({ silent: true });
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    showToast(`获取文章失败: ${error.response?.data?.error || error.message || '未知错误'}`, 'error', 3000);
    router.push({ name: 'AdminPosts' });
  } finally {
    loading.value = false;
  }
};

let saving = false;
const handleSubmit = async () => {
  if (saving || loading.value) return;
  if (!form.value.title || !form.value.content || form.value.content.trim() === '') {
    showToast('请填写标题和内容', 'warn');
    return;
  }

  loading.value = true;
  saving = true;

  try {
    const payload = {
      title: form.value.title,
      excerpt: form.value.excerpt || '',
      content: form.value.content,
      cover_image: form.value.cover_image || '',
      category_ids: form.value.category_ids.map((id) => Number(id)),
      tag_ids: form.value.tag_ids.map((id) => Number(id)),
      status: form.value.status || 'draft',
    };

    const hasNewImage = imageFile.value !== null;

    if (isEdit.value) {
      const response = await apiAdminPosts.update(route.params.id, payload, hasNewImage ? imageFile.value : null);
      if (hasNewImage && response.data) {
        const returnedUrl = response.data?.cover_image ||
          response.data?.data?.cover_image ||
          response.data?.post?.cover_image;
        if (returnedUrl) {
          if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl.value);
          }
          previewUrl.value = returnedUrl;
          form.value.cover_image = returnedUrl;
        }
      }
      showToast('更新成功', 'success');
    } else {
      const response = await apiAdminPosts.create(payload, hasNewImage ? imageFile.value : null);
      if (hasNewImage && response.data) {
        const returnedUrl = response.data?.cover_image ||
          response.data?.data?.cover_image ||
          response.data?.post?.cover_image;
        if (returnedUrl) {
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
    showToast(`保存失败: ${errorMsg}`, 'error', 3200);
  } finally {
    loading.value = false;
    saving = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTags()]);
  if (isEdit.value) {
    await fetchPost();
  } else {
    taxonomyHint.value = '开始写作后会自动刷新推荐，也可以手动点击“刷新推荐”。';
  }
});

watch(
  () => [form.value.title, form.value.excerpt, form.value.content],
  () => {
    scheduleSuggestionRefresh();
  }
);

onBeforeUnmount(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (suggestTimer) {
    clearTimeout(suggestTimer);
  }
});
</script>

<style scoped>
.article-title-input {
  font-size: 1.28rem;
  font-weight: 600;
}

.cover-preview {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.cover-preview-image {
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--admin-line);
  object-fit: cover;
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

.tax-selector {
  display: grid;
  gap: 10px;
}

.tax-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.taxonomy-recommend-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(95, 122, 86, 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(126, 156, 112, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(251, 248, 240, 0.96), rgba(246, 241, 231, 0.9));
}

.taxonomy-recommend-copy {
  margin: 0;
  color: var(--admin-soft-text);
  line-height: 1.6;
}

.taxonomy-hint {
  margin: 0;
}

.taxonomy-recommend-group {
  display: grid;
  gap: 10px;
}

.taxonomy-recommend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--admin-text);
}

.taxonomy-recommend-meta {
  color: var(--admin-soft-text);
  font-size: 0.85rem;
}

.taxonomy-suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.taxonomy-suggestion-chip {
  display: grid;
  gap: 4px;
  min-width: 148px;
  padding: 10px 12px;
  border: 1px solid rgba(95, 122, 86, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  color: #334234;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.taxonomy-suggestion-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(95, 122, 86, 0.28);
  background: rgba(250, 253, 247, 0.95);
}

.taxonomy-suggestion-chip.active {
  border-color: rgba(107, 143, 113, 0.42);
  background: rgba(107, 143, 113, 0.12);
  box-shadow: inset 0 0 0 1px rgba(107, 143, 113, 0.1);
}

.taxonomy-suggestion-title {
  font-weight: 600;
}

.taxonomy-suggestion-score,
.taxonomy-suggestion-keywords {
  font-size: 0.8rem;
  color: var(--admin-soft-text);
}

.tax-search {
  height: 38px;
}

.selected-tax-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tax-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid rgba(107, 143, 113, 0.22);
  border-radius: 999px;
  background: rgba(107, 143, 113, 0.08);
  color: var(--admin-accent);
  cursor: pointer;
}

.selected-tax-remove {
  font-size: 14px;
  line-height: 1;
  opacity: 0.72;
}

.admin-choice-grid.compact {
  max-height: 220px;
  overflow: auto;
  padding-right: 4px;
}

.admin-choice-button {
  appearance: none;
  font: inherit;
}

</style>
