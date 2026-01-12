<template>
  <div class="admin-tags">
    <div class="tags-header">
      <h2>标签管理</h2>
      <button @click="showCreateForm = true" class="create-btn">+ 新建标签</button>
    </div>

    <div v-if="showCreateForm" class="create-form">
      <h3>新建标签</h3>
      <div class="form-row">
        <input v-model="newTag.name" type="text" placeholder="标签名称" class="input" />
        <input v-model="newTag.slug" type="text" placeholder="标签标识（slug）" class="input" />
        <button @click="handleCreate" class="submit-btn">创建</button>
        <button @click="cancelCreate" class="cancel-btn">取消</button>
      </div>
    </div>

    <div class="tags-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>标识</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in tags" :key="tag.id">
            <td>{{ tag.id }}</td>
            <td>
              <input 
                v-if="editingId === tag.id" 
                v-model="editForm.name" 
                type="text" 
                class="inline-input"
              />
              <span v-else>{{ tag.name }}</span>
            </td>
            <td>
              <input 
                v-if="editingId === tag.id" 
                v-model="editForm.slug" 
                type="text" 
                class="inline-input"
              />
              <span v-else>{{ tag.slug }}</span>
            </td>
            <td class="actions-cell">
              <template v-if="editingId === tag.id">
                <button @click="handleUpdate(tag.id)" class="icon-btn save-btn" title="保存">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </button>
                <button @click="cancelEdit" class="icon-btn cancel-btn" title="取消">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </template>
              <template v-else>
                <button @click="startEdit(tag)" class="icon-btn edit-btn" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button @click="handleDelete(tag.id)" class="icon-btn delete-btn" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="!loading && tags.length === 0" class="empty">暂无标签</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminTags } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';

const tags = ref([]);
const loading = ref(false);
const showCreateForm = ref(false);
const editingId = ref(null);
const editForm = ref({ name: '', slug: '' });
const newTag = ref({ name: '', slug: '' });

const fetchTags = async () => {
  loading.value = true;
  try {
    const response = await apiMeta.tags();
    tags.value = response.data.tags || response.data || [];
  } catch (error) {
    console.error('获取标签失败:', error);
    showToast('获取标签失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!newTag.value.name || !newTag.value.slug) {
    showToast('请填写名称和标识', 'warn');
    return;
  }

  try {
    await apiAdminTags.create({
      name: newTag.value.name,
      slug: newTag.value.slug,
    });
    await fetchTags();
    newTag.value = { name: '', slug: '' };
    showCreateForm.value = false;
    showToast('创建成功', 'success');
  } catch (error) {
    console.error('创建失败:', error);
    showToast('创建失败', 'error', 3000);
  }
};

const cancelCreate = () => {
  showCreateForm.value = false;
  newTag.value = { name: '', slug: '' };
};

const startEdit = (tag) => {
  editingId.value = tag.id;
  editForm.value = { name: tag.name, slug: tag.slug };
};

const cancelEdit = () => {
  editingId.value = null;
  editForm.value = { name: '', slug: '' };
};

const handleUpdate = async (id) => {
  if (!editForm.value.name || !editForm.value.slug) {
    showToast('请填写名称和标识', 'warn');
    return;
  }

  try {
    await apiAdminTags.update(id, {
      name: editForm.value.name,
      slug: editForm.value.slug,
    });
    await fetchTags();
    cancelEdit();
    showToast('更新成功', 'success');
  } catch (error) {
    console.error('更新失败:', error);
    showToast('更新失败', 'error', 3000);
  }
};

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个标签吗？', { title: '删除标签确认', okText: '删除', cancelText: '取消', type: 'warn' });
  if (!ok) return;

  try {
    await apiAdminTags.delete(id);
    await fetchTags();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败', 'error', 3000);
  }
};

onMounted(() => {
  fetchTags();
});
</script>

<style scoped>
/* 苹果官网风格设计 */
.admin-tags {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;
}

.tags-header {
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

.tags-header h2 {
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
  border: none;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.create-btn:hover {
  background: #0077ed;
  transform: translateY(-1px);
}

.create-form {
  background: #ffffff;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0;
  padding: 32px 40px;
  margin: 0;
}

.create-form h3 {
  margin: 0 0 20px;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.input {
  flex: 1;
  min-width: 220px;
  padding: 10px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 14px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.inline-input {
  padding: 6px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 13px;
  width: 160px;
  transition: all 0.2s ease;
}

.inline-input:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.tags-table {
  background: #ffffff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  flex: 1;
  overflow-y: auto;
  margin: 0;
}

.tags-table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.tags-table::-webkit-scrollbar-track {
  background: transparent;
}

.tags-table::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 5px;
}

.tags-table::-webkit-scrollbar-thumb:hover {
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

.edit-btn {
  color: #0071e3;
}

.edit-btn:hover {
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

.save-btn {
  color: #0071e3;
}

.save-btn:hover {
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

.cancel-btn {
  color: #86868b;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
}

.submit-btn {
  padding: 8px 16px;
  height: 32px;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.submit-btn:hover {
  background: #0077ed;
  transform: translateY(-1px);
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

