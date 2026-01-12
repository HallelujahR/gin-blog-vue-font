<template>
  <div class="admin-pages">
    <div class="pages-header">
      <h2>页面管理</h2>
      <router-link to="/admin/pages/create" class="create-btn">+ 新建页面</router-link>
    </div>

    <div class="pages-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>Slug</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id">
            <td>{{ page.id }}</td>
            <td class="title-cell">
              <router-link :to="`/about`" target="_blank" v-if="page.slug === 'about-me' || page.slug === 'about'">{{ page.title }}</router-link>
              <span v-else>{{ page.title }}</span>
            </td>
            <td>{{ page.slug }}</td>
            <td>
              <span :class="['status-badge', page.status === 'published' ? 'published' : 'draft']">
                {{ page.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ formatDate(page.updated_at || page.created_at) }}</td>
            <td class="actions-cell">
              <router-link :to="`/admin/pages/edit/${page.id}`" class="icon-btn edit-btn" title="编辑">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </router-link>
              <button @click="handleDelete(page.id)" class="icon-btn delete-btn" title="删除">
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
    <div v-if="!loading && pages.length === 0" class="empty">暂无页面</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminPages } from '../../api/admin.js';
import { showToast } from '../../utils/toast';

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

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个页面吗？', { title: '删除页面确认', okText: '删除', cancelText: '取消', type: 'warn' });
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
/* 苹果官网风格设计 */
.admin-pages {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.pages-header {
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

.pages-header h2 {
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

.pages-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.pages-table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.pages-table::-webkit-scrollbar-track {
  background: transparent;
}

.pages-table::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.pages-table::-webkit-scrollbar-thumb:hover {
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

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 400;
  border: none;
}

.status-badge.published {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.status-badge.draft {
  background: rgba(255, 159, 10, 0.1);
  color: #ff9f0a;
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
</style>

