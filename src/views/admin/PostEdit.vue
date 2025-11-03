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
        <textarea v-model="form.content" rows="20" required placeholder="请输入文章内容（Markdown格式）"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>封面图片URL</label>
          <input v-model="form.cover_image" type="text" placeholder="请输入封面图片URL" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.category_id" class="select-input">
            <option value="">选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>标签</label>
          <div class="tags-select">
            <label v-for="tag in tags" :key="tag.id" class="tag-checkbox">
              <input type="checkbox" :value="tag.id" v-model="form.tag_ids" />
              <span>{{ tag.name }}</span>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiAdminPosts, apiAdminCategories, apiAdminTags } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_id: '',
  tag_ids: [],
  status: 'draft',
});

const fetchCategories = async () => {
  try {
    const response = await apiMeta.categories();
    categories.value = response.data.categories || response.data || [];
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

const fetchTags = async () => {
  try {
    const response = await apiMeta.tags();
    tags.value = response.data.tags || response.data || [];
  } catch (error) {
    console.error('获取标签失败:', error);
  }
};

const fetchPost = async () => {
  if (!isEdit.value) return;
  
  try {
    const response = await apiAdminPosts.detail(route.params.id);
    const post = response.data.post || response.data;
    
    form.value = {
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      category_id: post.category_id || (post.categories && post.categories[0]?.id) || '',
      tag_ids: post.tags ? post.tags.map(t => t.id) : [],
      status: post.status || 'draft',
    };
  } catch (error) {
    console.error('获取文章失败:', error);
    alert('获取文章失败');
  }
};

const handleSubmit = async () => {
  if (!form.value.title || !form.value.content) {
    alert('请填写标题和内容');
    return;
  }

  loading.value = true;

  try {
    const payload = {
      title: form.value.title,
      excerpt: form.value.excerpt,
      content: form.value.content,
      cover_image: form.value.cover_image,
      category_id: form.value.category_id ? Number(form.value.category_id) : undefined,
      tag_ids: form.value.tag_ids.map(id => Number(id)),
      status: form.value.status,
    };

    if (isEdit.value) {
      await apiAdminPosts.update(route.params.id, payload);
      alert('更新成功');
    } else {
      await apiAdminPosts.create(payload);
      alert('创建成功');
    }
    
    router.push({ name: 'AdminPosts' });
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败: ' + (error.response?.data?.error || error.message));
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTags()]);
  if (isEdit.value) {
    await fetchPost();
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
  padding: 12px 24px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.cancel-btn {
  padding: 14px 28px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
  transform: translateY(-1px);
}
</style>

