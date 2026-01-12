<template>
  <div class="admin-comments">
    <div class="comments-header">
      <h2>评论管理</h2>
    </div>

    <div class="comments-filters">
      <input v-model="search" type="text" placeholder="搜索评论..." class="search-input" @keyup.enter="fetchComments" />
      <button @click="fetchComments" class="search-btn" title="搜索">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>

    <div class="comments-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>评论内容</th>
            <th>作者</th>
            <th>文章</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comment in comments" :key="comment.id">
            <td>{{ comment.id }}</td>
            <td class="content-cell">{{ comment.content }}</td>
            <td>{{ comment.author_name }}</td>
            <td>
              <router-link :to="`/blog/${comment.post_id}`" target="_blank" v-if="comment.post_id">
                查看文章
              </router-link>
            </td>
            <td>
              <select v-model="comment.status" @change="handleStatusChange(comment.id, comment.status)" class="status-select">
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </td>
            <td>{{ formatDate(comment.created_at) }}</td>
            <td class="actions-cell">
              <button @click="handleDelete(comment.id)" class="icon-btn delete-btn" title="删除">
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
    <div v-if="!loading && comments.length === 0" class="empty">暂无评论</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminComments } from '../../api/admin.js';
import { showToast } from '../../utils/toast';

const comments = ref([]);
const search = ref('');
const loading = ref(false);

const fetchComments = async () => {
  loading.value = true;
  try {
    const response = await apiAdminComments.list({ q: search.value || undefined });
    comments.value = response.data.comments || response.data || [];
  } catch (error) {
    console.error('获取评论列表失败:', error);
    showToast('获取评论列表失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async (id, status) => {
  try {
    await apiAdminComments.updateStatus(id, status);
    showToast('状态更新成功', 'success');
  } catch (error) {
    console.error('更新状态失败:', error);
    showToast('更新状态失败', 'error', 3000);
    await fetchComments();
  }
};

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这条评论吗？', { title: '删除评论确认', okText: '删除', cancelText: '取消', type: 'warn' });
  if (!ok) return;

  try {
    await apiAdminComments.delete(id);
    await fetchComments();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败', 'error', 3000);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  fetchComments();
});
</script>

<style scoped>
/* 苹果官网风格设计 */
.admin-comments {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.comments-header {
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

.comments-header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.comments-filters {
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

.comments-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  flex: 1;
  overflow-y: auto;
}

.comments-table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.comments-table::-webkit-scrollbar-track {
  background: transparent;
}

.comments-table::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.comments-table::-webkit-scrollbar-thumb:hover {
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
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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

.content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-select {
  padding: 6px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-select:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
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
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
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
</style>

