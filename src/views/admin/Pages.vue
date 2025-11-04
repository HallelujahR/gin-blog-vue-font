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
              <router-link :to="`/admin/pages/edit/${page.id}`" class="edit-btn">编辑</router-link>
              <button @click="handleDelete(page.id)" class="delete-btn">删除</button>
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

const pages = ref([]);
const loading = ref(false);

const fetchPages = async () => {
  loading.value = true;
  try {
    const response = await apiAdminPages.list();
    pages.value = response.data.pages || response.data || [];
  } catch (error) {
    console.error('获取页面列表失败:', error);
    alert('获取页面列表失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm('确定要删除这个页面吗？')) return;
  
  try {
    await apiAdminPages.delete(id);
    await fetchPages();
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
  fetchPages();
});
</script>

<style scoped>
.admin-pages {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.pages-header h2 {
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

.pages-table {
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

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.published {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-badge.draft {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fde68a;
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
</style>

