<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">碎碎念管理</p>
        <h2 class="admin-page-title">动态列表</h2>
      </div>
      <router-link to="/admin/moments/create" class="admin-btn">发布碎碎念</router-link>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">按时间流展示，适合轻量更新与日常记录</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ moments.length }} 条</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>内容</th>
            <th style="width:120px;">图片</th>
            <th style="width:120px;">状态</th>
            <th style="width:140px;">时间</th>
            <th style="width:150px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="moment in moments" :key="moment.id">
            <td>#{{ moment.id }}</td>
            <td>
              <div class="admin-cell-title">{{ shorten(moment.content) }}</div>
              <div class="admin-cell-meta" v-if="moment.mood">{{ moment.mood }}</div>
            </td>
            <td>{{ moment.images?.length || 0 }} 张</td>
            <td>
              <span class="admin-badge" :class="{ published: moment.status === 'published' }">
                {{ moment.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ formatDate(moment.published_at || moment.created_at) }}</td>
            <td>
              <div class="admin-inline-actions">
                <router-link :to="`/admin/moments/edit/${moment.id}`" class="admin-mini-btn">编辑</router-link>
                <button @click="handleDelete(moment.id)" class="admin-mini-btn danger">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="moments.length === 0" class="admin-panel">
      <div class="admin-panel-body">还没有碎碎念内容。</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiAdminMoments } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

const loading = ref(false);
const moments = ref([]);

const fetchMoments = async () => {
  loading.value = true;
  try {
    const response = await apiAdminMoments.list();
    moments.value = response.data?.moments || [];
  } catch (error) {
    console.error('获取碎碎念失败:', error);
    showToast('获取碎碎念失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这条碎碎念吗？', {
    title: '删除碎碎念确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
  if (!ok) return;

  try {
    await apiAdminMoments.delete(id);
    await fetchMoments();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除碎碎念失败:', error);
    showToast('删除碎碎念失败', 'error', 3000);
  }
};

const shorten = (content = '') => {
  if (content.length <= 90) return content;
  return `${content.slice(0, 90)}...`;
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
  fetchMoments();
});
</script>

<style scoped>
.admin-badge.published {
  background: rgba(117, 137, 102, 0.16);
  color: #486038;
}
</style>
