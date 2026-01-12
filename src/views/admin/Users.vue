<template>
  <div class="admin-users">
    <div class="users-header">
      <h2>用户管理</h2>
    </div>

    <div class="users-filters">
      <input v-model="search" type="text" placeholder="搜索用户..." class="search-input" @keyup.enter="fetchUsers" />
      <button @click="fetchUsers" class="search-btn" title="搜索">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>

    <div class="users-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select v-model="user.role" @change="handleRoleChange(user.id, user.role)" class="role-select">
                <option value="author">用户</option>
                <option value="admin">管理员</option>
              </select>
            </td>
            <td>
              <select v-model="user.status" @change="handleStatusChange(user.id, user.status)" class="status-select">
                <option value="active">激活</option>
                <option value="inactive">禁用</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions-cell">
              <button @click="handleDelete(user.id)" class="icon-btn delete-btn" title="删除">
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
    <div v-if="!loading && users.length === 0" class="empty">暂无用户</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminUsers } from '../../api/admin.js';
import { showToast } from '../../utils/toast';

const users = ref([]);
const search = ref('');
const loading = ref(false);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await apiAdminUsers.list({ q: search.value || undefined });
    users.value = response.data.users || response.data || [];
  } catch (error) {
    console.error('获取用户列表失败:', error);
    showToast('获取用户列表失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleRoleChange = async (id, role) => {
  try {
    await apiAdminUsers.updateRole(id, role);
    showToast('角色更新成功', 'success');
  } catch (error) {
    console.error('更新角色失败:', error);
    showToast('更新角色失败', 'error', 3000);
    await fetchUsers();
  }
};

const handleStatusChange = async (id, status) => {
  try {
    await apiAdminUsers.updateStatus(id, status);
    showToast('状态更新成功', 'success');
  } catch (error) {
    console.error('更新状态失败:', error);
    showToast('更新状态失败', 'error', 3000);
    await fetchUsers();
  }
};

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个用户吗？', { title: '删除用户确认', okText: '删除', cancelText: '取消', type: 'warn' });
  if (!ok) return;

  try {
    await apiAdminUsers.delete(id);
    await fetchUsers();
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
  fetchUsers();
});
</script>

<style scoped>
/* 苹果官网风格设计 */
.admin-users {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.users-header {
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

.users-header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.users-filters {
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

.users-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  flex: 1;
  overflow-y: auto;
}

.users-table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.users-table::-webkit-scrollbar-track {
  background: transparent;
}

.users-table::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.users-table::-webkit-scrollbar-thumb:hover {
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

.role-select, .status-select {
  padding: 6px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-select:focus, .status-select:focus {
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

