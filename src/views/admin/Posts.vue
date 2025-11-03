<template>
  <div class="admin-posts">
    <div class="posts-header">
        <h2>文章管理</h2>
        <router-link to="/admin/posts/create" class="create-btn">+ 新建文章</router-link>
      </div>
      
      <div class="posts-filters">
        <input v-model="search" type="text" placeholder="搜索文章..." class="search-input" @keyup.enter="handleSearch" />
        <button @click="handleSearch" class="search-btn">搜索</button>
      </div>

      <div class="posts-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>分类</th>
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
                <span v-for="cat in (post.categories || [])" :key="cat.id" class="tag">{{ cat.name }}</span>
              </td>
              <td>{{ post.view_count || 0 }}</td>
              <td>{{ formatDate(post.published_at || post.created_at) }}</td>
              <td class="actions-cell">
                <router-link :to="`/admin/posts/edit/${post.id}`" class="edit-btn">编辑</router-link>
                <button @click="handleDelete(post.id)" class="delete-btn">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!loading && posts.length === 0" class="empty">暂无文章</div>

      <!-- 分页组件 -->
      <div v-if="total > 0" class="pagination">
        <div class="pagination-info">
          共 {{ total }} 条，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
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
    alert('获取文章列表失败');
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
  if (!confirm('确定要删除这篇文章吗？')) return;
  
  try {
    await apiAdminPosts.delete(id);
    await fetchPosts();
    alert('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
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
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-posts {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.posts-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.create-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.posts-filters {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 20px 24px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.search-input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(132, 204, 22, 0.4);
}

.posts-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  box-shadow: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

th {
  padding: 16px 18px;
  text-align: left;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 2px solid #f1f5f9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 16px 18px;
  color: #1e293b;
  font-size: 14px;
  border-bottom: 1px solid #f8fafc;
}

tbody tr {
  transition: all 0.2s ease;
}

tbody tr:hover {
  background: #f8fafc;
  transform: scale(1.001);
}

.title-cell a {
  color: #1e293b;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.title-cell a:hover {
  color: #667eea;
}

.tag {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #667eea;
  border-radius: 8px;
  font-size: 12px;
  margin-right: 8px;
  font-weight: 600;
  border: 1px solid #e0e7ff;
}

.actions-cell {
  display: flex;
  gap: 10px;
}

.edit-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.delete-btn {
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

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #ffffff;
  border: none;
  border-top: 1px solid #f1f5f9;
  border-radius: 0;
  margin: 0;
  box-shadow: none;
}

.pagination-info {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-btn {
  padding: 10px 16px;
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 44px;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.page-ellipsis {
  padding: 8px 4px;
  color: #94a3b8;
  font-size: 14px;
}
</style>

