<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">评论管理</p>
        <h2 class="admin-page-title">评论列表</h2>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <input v-model="search" type="text" placeholder="搜索评论内容或作者" class="admin-search" @keyup.enter="fetchComments" />
        <button @click="fetchComments" class="admin-btn admin-btn-ghost">检索</button>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ comments.length }} 条评论</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>评论内容</th>
            <th style="width:120px;">作者</th>
            <th style="width:120px;">文章</th>
            <th style="width:140px;">状态</th>
            <th style="width:140px;">时间</th>
            <th style="width:110px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comment in comments" :key="comment.id">
            <td>#{{ comment.id }}</td>
            <td>
              <div class="admin-cell-title">{{ comment.content }}</div>
              <div class="admin-cell-meta" v-if="comment.author_email">{{ comment.author_email }}</div>
            </td>
            <td>{{ comment.author_name }}</td>
            <td>
              <router-link v-if="comment.post_id" :to="`/blog/${comment.post_id}`" target="_blank" class="admin-mini-btn">
                查看文章
              </router-link>
            </td>
            <td>
              <select v-model="comment.status" @change="handleStatusChange(comment.id, comment.status)" class="admin-select">
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </td>
            <td>{{ formatDate(comment.created_at) }}</td>
            <td>
              <button @click="handleDelete(comment.id)" class="admin-mini-btn danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="comments.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无评论。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminComments } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

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

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这条评论吗？', {
    title: '删除评论确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
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
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  fetchComments();
});
</script>

<style scoped>
</style>
