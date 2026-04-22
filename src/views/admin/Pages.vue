<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">内容管理</p>
        <h2 class="admin-page-title">固定页面</h2>
      </div>
      <router-link to="/admin/pages/create" class="admin-btn">新建页面</router-link>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">用于 About 等固定内容页维护</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ pages.length }} 页</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>页面</th>
            <th style="width:180px;">Slug</th>
            <th style="width:96px;">状态</th>
            <th style="width:132px;">更新时间</th>
            <th style="width:150px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id">
            <td>#{{ page.id }}</td>
            <td>
              <div class="admin-cell-title">
                <router-link v-if="page.slug === 'about-me' || page.slug === 'about'" to="/about" target="_blank">
                  {{ page.title }}
                </router-link>
                <span v-else>{{ page.title }}</span>
              </div>
              <div class="admin-cell-meta">{{ page.excerpt || '固定页面内容' }}</div>
            </td>
            <td>{{ page.slug }}</td>
            <td>
              <span class="admin-badge" :class="{ published: page.status === 'published' }">
                {{ page.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ formatDate(page.updated_at || page.created_at) }}</td>
            <td>
              <div class="admin-inline-actions">
                <router-link :to="`/admin/pages/edit/${page.id}`" class="admin-mini-btn">编辑</router-link>
                <button @click="handleDelete(page.id)" class="admin-mini-btn danger">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="pages.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无页面。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminPages } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

const pages = ref([]);
const loading = ref(false);

const fetchPages = async () => {
  loading.value = true;
  try {
    const response = await apiAdminPages.list();
    pages.value = response.data.pages || response.data || [];
  } catch (error) {
    console.error('获取页面列表失败:', error);
    showToast('获取页面列表失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个页面吗？', {
    title: '删除页面确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
  if (!ok) return;

  try {
    await apiAdminPages.delete(id);
    await fetchPages();
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
  fetchPages();
});
</script>

<style scoped>
.admin-badge.published {
  background: rgba(117, 137, 102, 0.16);
  color: #486038;
}
</style>
