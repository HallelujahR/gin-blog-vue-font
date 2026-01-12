<template>
  <div class="admin-posts">
    <div class="posts-header">
        <h2>文章管理</h2>
        <router-link to="/admin/posts/create" class="create-btn">+ 新建文章</router-link>
      </div>
      
      <div class="posts-filters">
        <input v-model="search" type="text" placeholder="搜索文章..." class="search-input" @keyup.enter="handleSearch" />
        <button @click="handleSearch" class="search-btn" title="搜索">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>

      <div class="posts-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>分类</th>
              <th>标签</th>
              <th>浏览量</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id">
              <td>{{ post.id }}</td>
              <td class="title-cell">
                <router-link :to="`/blog/${post.id}`" target="_blank">{{ post.title }}</router-link>
              </td>
              <td>
                <span v-for="cat in (post.category_names || [])" :key="cat.id" class="tag">{{ cat }}</span>
              </td>
              <td>
                <span v-for="tag in (post.tag_names || [])" :key="tag.id" class="tag">{{ tag }}</span>
              </td>
              <td>{{ post.view_count || 0 }}</td>
              <td>{{ formatDate(post.published_at || post.created_at) }}</td>
              <td class="actions-cell">
                <router-link :to="`/admin/posts/edit/${post.id}`" class="icon-btn edit-btn" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </router-link>
                <button @click="handleDelete(post.id)" class="icon-btn delete-btn" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!loading && posts.length === 0" class="empty">暂无文章</div>

      <!-- 分页组件 -->
      <div v-if="total > 0" class="pagination">
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)" 
            :disabled="currentPage === 1" 
            class="page-btn"
          >首页</button>
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage === 1" 
            class="page-btn"
          >上一页</button>
          
          <template v-for="pageNum in visiblePages" :key="pageNum">
            <button 
              v-if="pageNum !== '...'"
              @click="goToPage(pageNum)"
              :class="['page-btn', { active: pageNum === currentPage }]"
            >{{ pageNum }}</button>
            <span v-else class="page-ellipsis">...</span>
          </template>
          
          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage === totalPages" 
            class="page-btn"
          >下一页</button>
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages" 
            class="page-btn"
          >末页</button>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiAdminPosts } from '../../api/admin.js';
import { showToast } from '../../utils/toast';

const posts = ref([]);
const search = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  
  return pages;
});

const fetchPosts = async (page = 1) => {
  loading.value = true;
  try {
    const response = await apiAdminPosts.list({ 
      q: search.value || undefined,
      page: page,
      size: pageSize.value
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

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这篇文章吗？', { title: '删除文章确认', type: 'warn', okText: '删除', cancelText: '取消' });
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
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

onMounted(() => {
  fetchPosts(1);
});
</script>

<style scoped>
/* 苹果官网风格设计 */
.admin-posts {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.posts-header {
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

.posts-header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.create-btn {
  padding: 8px 16px;
  height: 32px;
  background: #0071e3;
  color: #fff;
  text-decoration: none;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.create-btn:hover {
  background: #0077ed;
  transform: translateY(-1px);
}

.posts-filters {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 24px 40px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.search-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background: #0077ed;
  transform: scale(1.05);
}

.search-btn svg {
  width: 18px;
  height: 18px;
}

.posts-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.posts-table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.posts-table::-webkit-scrollbar-track {
  background: transparent;
}

.posts-table::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.posts-table::-webkit-scrollbar-thumb:hover {
  background: #86868b;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #fbfbfd;
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  padding: 14px 24px;
  text-align: left;
  color: #86868b;
  font-weight: 400;
  font-size: 11px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  vertical-align: middle;
}

td {
  padding: 14px 24px;
  color: #1d1d1f;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background: #fbfbfd;
}

.title-cell a {
  color: #0071e3;
  text-decoration: none;
  font-weight: 400;
  transition: color 0.2s ease;
}

.title-cell a:hover {
  color: #0077ed;
  text-decoration: underline;
}

.tag {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
  border-radius: 8px;
  font-size: 13px;
  margin-right: 8px;
  margin-bottom: 4px;
  font-weight: 400;
  border: none;
}

.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #86868b;
  text-decoration: none;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.edit-btn {
  color: #0071e3;
}

.edit-btn:hover {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

.delete-btn {
  color: #ff3b30;
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.loading, .empty {
  text-align: center;
  padding: 80px 20px;
  color: #86868b;
  font-size: 14px;
  font-weight: 400;
  background: #ffffff;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 40px;
  background: #ffffff;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0;
  margin: 0;
}

.pagination-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.page-btn {
  padding: 6px 12px;
  height: 28px;
  background: #ffffff;
  color: #1d1d1f;
  border: 1px solid #d2d2d7;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.page-btn:hover:not(:disabled) {
  background: #fbfbfd;
  border-color: #0071e3;
  color: #0071e3;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #fbfbfd;
}

.page-btn.active {
  background: #0071e3;
  color: #ffffff;
  border-color: transparent;
}

.page-ellipsis {
  padding: 6px 4px;
  color: #86868b;
  font-size: 13px;
  line-height: 28px;
}
</style>

