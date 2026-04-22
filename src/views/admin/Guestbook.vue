<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">留言板管理</p>
        <h2 class="admin-page-title">留言列表</h2>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <input
          v-model="search"
          type="text"
          placeholder="搜索留言内容、昵称或邮箱"
          class="admin-search"
          @keyup.enter="fetchMessages"
        />
        <select v-model="status" class="admin-select" @change="fetchMessages">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="spam">垃圾留言</option>
          <option value="trash">回收站</option>
        </select>
        <button @click="fetchMessages" class="admin-btn admin-btn-ghost">检索</button>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ total || messages.length }} 条留言</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>留言内容</th>
            <th style="width:120px;">昵称</th>
            <th style="width:190px;">邮箱</th>
            <th style="width:140px;">状态</th>
            <th style="width:140px;">时间</th>
            <th style="width:110px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="message in messages" :key="message.id">
            <td>#{{ message.id }}</td>
            <td>
              <div class="admin-cell-title guestbook-content">{{ message.content }}</div>
              <div class="admin-cell-meta" v-if="message.author_ip">{{ message.author_ip }}</div>
            </td>
            <td>{{ message.author_name }}</td>
            <td>{{ message.author_email }}</td>
            <td>
              <select
                v-model="message.status"
                class="admin-select"
                @change="handleStatusChange(message.id, message.status)"
              >
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="spam">垃圾留言</option>
                <option value="trash">回收站</option>
              </select>
            </td>
            <td>{{ formatDate(message.created_at) }}</td>
            <td>
              <button @click="handleDelete(message.id)" class="admin-mini-btn danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="messages.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无留言。</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiAdminGuestbook } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

const messages = ref([]);
const loading = ref(false);
const search = ref('');
const status = ref('');
const total = ref(0);

const fetchMessages = async () => {
  loading.value = true;
  try {
    const response = await apiAdminGuestbook.list({
      q: search.value || undefined,
      status: status.value || undefined,
      page: 1,
      page_size: 50,
    });
    messages.value = response.data?.messages || response.data || [];
    total.value = response.data?.total || messages.value.length;
  } catch (error) {
    console.error('获取留言列表失败:', error);
    showToast('获取留言列表失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async (id, nextStatus) => {
  try {
    await apiAdminGuestbook.updateStatus(id, nextStatus);
    showToast('状态更新成功', 'success');
  } catch (error) {
    console.error('更新留言状态失败:', error);
    showToast('更新留言状态失败', 'error', 3000);
    await fetchMessages();
  }
};

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这条留言吗？', {
    title: '删除留言确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
  if (!ok) return;

  try {
    await apiAdminGuestbook.delete(id);
    await fetchMessages();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除留言失败:', error);
    showToast('删除留言失败', 'error', 3000);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.guestbook-content {
  white-space: pre-wrap;
}
</style>
