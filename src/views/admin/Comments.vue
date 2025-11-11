<template>
  <div class="admin-comments">
    <div class="comments-header">
      <h2>评论管理</h2>
    </div>

    <div class="comments-filters">
      <input v-model="search" type="text" placeholder="搜索评论..." class="search-input" @keyup.enter="fetchComments" />
      <button @click="fetchComments" class="search-btn">搜索</button>
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
              <button @click="handleDelete(comment.id)" class="delete-btn">删除</button>
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
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-comments {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.comments-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.comments-filters {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 20px 24px;
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 0;
  box-shadow: none;
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

.comments-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f1f5f9;
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

.content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-select {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #1e293b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.actions-cell {
  display: flex;
  gap: 10px;
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
</style>

