<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">文章管理</p>
        <h2 class="admin-page-title">文章列表</h2>
      </div>
      <router-link to="/admin/posts/create" class="admin-btn">新建文章</router-link>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <input
          v-model="search"
          type="text"
          placeholder="搜索标题或摘要"
          class="admin-search"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="admin-btn admin-btn-ghost">检索</button>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ total || posts.length }} 篇</span>
        <span class="admin-statline">第 {{ currentPage }} / {{ Math.max(totalPages, 1) }} 页</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>标题</th>
            <th style="width:180px;">分类 / 标签</th>
            <th style="width:96px;">状态</th>
            <th style="width:90px;">浏览</th>
            <th style="width:132px;">时间</th>
            <th style="width:150px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>#{{ post.id }}</td>
            <td>
              <div class="admin-cell-title">
                <router-link :to="`/blog/${post.id}`" target="_blank">{{ post.title }}</router-link>
              </div>
              <div class="admin-cell-meta">{{ post.excerpt || '暂无摘要' }}</div>
            </td>
            <td>
              <div class="admin-tags" v-if="(post.category_names || []).length">
                <span v-for="cat in post.category_names || []" :key="cat" class="admin-tag">{{ cat }}</span>
              </div>
              <div class="admin-tags" v-if="(post.tag_names || []).length">
                <span v-for="tag in post.tag_names || []" :key="tag" class="admin-tag">{{ tag }}</span>
              </div>
            </td>
            <td>
              <span class="admin-badge" :class="{ published: post.status === 'published' }">
                {{ post.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ post.view_count || 0 }}</td>
            <td>{{ formatDate(post.published_at || post.created_at) }}</td>
            <td>
              <div class="admin-inline-actions">
                <router-link :to="`/admin/posts/edit/${post.id}`" class="admin-mini-btn">编辑</router-link>
                <router-link :to="`/blog/${post.id}`" target="_blank" class="admin-mini-btn">预览</router-link>
                <button @click="handleDelete(post.id)" class="admin-mini-btn danger">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="posts.length === 0" class="admin-panel">
      <div class="admin-panel-body">没有检索到文章。</div>
    </div>

    <div v-if="total > 0" class="admin-action-row">
      <div class="admin-inline-actions">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="admin-chip-btn">首页</button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="admin-chip-btn">上一页</button>
        <template v-for="pageNum in visiblePages" :key="pageNum">
          <button
            v-if="pageNum !== '...'"
            @click="goToPage(pageNum)"
            class="admin-chip-btn"
            :class="{ active: pageNum === currentPage }"
          >
            {{ pageNum }}
          </button>
          <span v-else class="admin-statline">...</span>
        </template>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="admin-chip-btn">下一页</button>
        <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="admin-chip-btn">末页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiAdminPosts } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

const posts = ref([]);
const search = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const visiblePages = computed(() => {
  const pages = [];
  const totalPageCount = totalPages.value;
  const current = currentPage.value;

  if (totalPageCount <= 7) {
    for (let i = 1; i <= totalPageCount; i += 1) pages.push(i);
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i += 1) pages.push(i);
    pages.push('...');
    pages.push(totalPageCount);
  } else if (current >= totalPageCount - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = totalPageCount - 4; i <= totalPageCount; i += 1) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    for (let i = current - 1; i <= current + 1; i += 1) pages.push(i);
    pages.push('...');
    pages.push(totalPageCount);
  }

  return pages;
});

const fetchPosts = async (page = 1) => {
  loading.value = true;
  try {
    const response = await apiAdminPosts.list({
      q: search.value || undefined,
      page,
      size: pageSize.value,
    });
    posts.value = response.data.posts || response.data || [];
    total.value = response.data.total || posts.value.length;
    currentPage.value = page;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    showToast('获取文章列表失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  fetchPosts(page);
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchPosts(1);
};

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这篇文章吗？', {
    title: '删除文章确认',
    type: 'warn',
    okText: '删除',
    cancelText: '取消',
  });
  if (!ok) return;

  try {
    await apiAdminPosts.delete(id);
    await fetchPosts();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败', 'error', 3000);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

onMounted(() => {
  fetchPosts(1);
});
</script>

<style scoped>
.admin-badge.published {
  background: rgba(117, 137, 102, 0.16);
  color: #486038;
}

.admin-chip-btn.active {
  background: rgba(117, 137, 102, 0.14);
  border-color: rgba(117, 137, 102, 0.24);
  color: #445b36;
}
</style>
