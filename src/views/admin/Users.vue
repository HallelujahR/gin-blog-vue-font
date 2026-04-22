<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">用户管理</p>
        <h2 class="admin-page-title">用户列表</h2>
      </div>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <input v-model="search" type="text" placeholder="搜索用户或邮箱" class="admin-search" @keyup.enter="fetchUsers" />
        <button @click="fetchUsers" class="admin-btn admin-btn-ghost">检索</button>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ users.length }} 位用户</span>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:80px;">ID</th>
            <th>用户</th>
            <th style="width:140px;">角色</th>
            <th style="width:140px;">状态</th>
            <th style="width:132px;">创建时间</th>
            <th style="width:164px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>#{{ user.id }}</td>
            <td>
              <div class="admin-cell-title">{{ user.username }}</div>
              <div class="admin-cell-meta">{{ user.email || '暂无邮箱' }}</div>
            </td>
            <td>
              <select v-model="user.role" @change="handleRoleChange(user.id, user.role)" class="admin-select">
                <option value="author">用户</option>
                <option value="admin">管理员</option>
              </select>
            </td>
            <td>
              <select v-model="user.status" @change="handleStatusChange(user.id, user.status)" class="admin-select">
                <option value="active">激活</option>
                <option value="inactive">禁用</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="admin-inline-actions">
                <button @click="handleChangePassword(user)" class="admin-mini-btn">改密</button>
                <button @click="handleDelete(user.id)" class="admin-mini-btn danger">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="users.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无用户。</div>
    </div>

    <div v-if="showPasswordDialog" class="dialog-overlay" @click.self="closePasswordDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>修改密码</h3>
          <button @click="closePasswordDialog" class="dialog-close">关闭</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-copy">为用户 {{ currentUser?.username }} 设置新密码。</p>
          <div class="admin-fieldset">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="至少 6 位"
              class="admin-input"
              @keyup.enter="submitPassword"
            />
          </div>
          <div v-if="passwordError" class="admin-error">{{ passwordError }}</div>
        </div>
        <div class="dialog-footer">
          <button @click="closePasswordDialog" class="admin-btn admin-btn-ghost">取消</button>
          <button @click="submitPassword" class="admin-btn" :disabled="!newPassword || newPassword.length < 6">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminUsers } from '../../api/admin.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

const users = ref([]);
const search = ref('');
const loading = ref(false);
const showPasswordDialog = ref(false);
const currentUser = ref(null);
const newPassword = ref('');
const passwordError = ref('');

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

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个用户吗？', {
    title: '删除用户确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
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

const handleChangePassword = (user) => {
  currentUser.value = user;
  newPassword.value = '';
  passwordError.value = '';
  showPasswordDialog.value = true;
};

const closePasswordDialog = () => {
  showPasswordDialog.value = false;
  currentUser.value = null;
  newPassword.value = '';
  passwordError.value = '';
};

const submitPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    passwordError.value = '密码至少需要 6 位';
    return;
  }

  try {
    await apiAdminUsers.updatePassword(currentUser.value.id, newPassword.value);
    showToast('密码修改成功', 'success');
    closePasswordDialog();
  } catch (error) {
    console.error('修改密码失败:', error);
    passwordError.value = error.response?.data?.message || '修改密码失败';
    showToast('修改密码失败', 'error', 3000);
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
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(57, 52, 45, 0.22);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
  z-index: 60;
}

.dialog-content {
  width: min(100%, 520px);
  border: 1px solid var(--admin-line);
  border-radius: 26px;
  background: var(--admin-surface);
  box-shadow: 0 28px 60px rgba(56, 50, 41, 0.16);
}

.dialog-header,
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid var(--admin-line);
}

.dialog-footer {
  border-bottom: 0;
  border-top: 1px solid var(--admin-line);
}

.dialog-header h3 {
  margin: 0;
  color: var(--admin-ink);
}

.dialog-body {
  padding: 1.25rem;
}

.dialog-copy {
  margin: 0 0 1rem;
  color: var(--admin-soft-text);
}

.dialog-close {
  border: 0;
  background: transparent;
  color: var(--admin-soft-text);
  cursor: pointer;
}
</style>
