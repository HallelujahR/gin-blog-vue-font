<template>
  <div class="admin-categories">
    <div class="categories-header">
      <h2>分类管理</h2>
      <button @click="showCreateForm = true" class="create-btn">+ 新建分类</button>
    </div>

    <div v-if="showCreateForm" class="create-form">
      <h3>新建分类</h3>
      <div class="form-row">
        <input v-model="newCategory.name" type="text" placeholder="分类名称" class="input" />
        <input v-model="newCategory.slug" type="text" placeholder="分类标识（slug）" class="input" />
        <button @click="handleCreate" class="submit-btn">创建</button>
        <button @click="cancelCreate" class="cancel-btn">取消</button>
      </div>
    </div>

    <div class="categories-table">
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
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.id }}</td>
            <td>
              <input 
                v-if="editingId === category.id" 
                v-model="editForm.name" 
                type="text" 
                class="inline-input"
              />
              <span v-else>{{ category.name }}</span>
            </td>
            <td>
              <input 
                v-if="editingId === category.id" 
                v-model="editForm.slug" 
                type="text" 
                class="inline-input"
              />
              <span v-else>{{ category.slug }}</span>
            </td>
            <td class="actions-cell">
              <template v-if="editingId === category.id">
                <button @click="handleUpdate(category.id)" class="save-btn">保存</button>
                <button @click="cancelEdit" class="cancel-btn">取消</button>
              </template>
              <template v-else>
                <button @click="startEdit(category)" class="edit-btn">编辑</button>
                <button @click="handleDelete(category.id)" class="delete-btn">删除</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="!loading && categories.length === 0" class="empty">暂无分类</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminCategories } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';

const categories = ref([]);
const loading = ref(false);
const showCreateForm = ref(false);
const editingId = ref(null);
const editForm = ref({ name: '', slug: '' });
const newCategory = ref({ name: '', slug: '' });

const fetchCategories = async () => {
  loading.value = true;
  try {
    const response = await apiMeta.categories();
    categories.value = response.data.categories || response.data || [];
  } catch (error) {
    console.error('获取分类失败:', error);
    showToast('获取分类失败', 'error', 3000);
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!newCategory.value.name || !newCategory.value.slug) {
    showToast('请填写名称和标识', 'warn');
    return;
  }

  try {
    await apiAdminCategories.create({
      name: newCategory.value.name,
      slug: newCategory.value.slug,
    });
    await fetchCategories();
    newCategory.value = { name: '', slug: '' };
    showCreateForm.value = false;
    showToast('创建成功', 'success');
  } catch (error) {
    console.error('创建失败:', error);
    showToast('创建失败', 'error', 3000);
  }
};

const cancelCreate = () => {
  showCreateForm.value = false;
  newCategory.value = { name: '', slug: '' };
};

const startEdit = (category) => {
  editingId.value = category.id;
  editForm.value = { name: category.name, slug: category.slug };
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
    await apiAdminCategories.update(id, {
      name: editForm.value.name,
      slug: editForm.value.slug,
    });
    await fetchCategories();
    cancelEdit();
    showToast('更新成功', 'success');
  } catch (error) {
    console.error('更新失败:', error);
    showToast('更新失败', 'error', 3000);
  }
};

import { confirm as askConfirm } from '../../utils/confirm';
const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个分类吗？', { title: '删除分类确认', okText: '删除', cancelText: '取消', type: 'warn' });
  if (!ok) return;

  try {
    await apiAdminCategories.delete(id);
    await fetchCategories();
    showToast('删除成功', 'success');
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败', 'error', 3000);
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-categories {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.categories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.categories-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.create-form {
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 0;
  padding: 24px;
  margin: 0;
  box-shadow: none;
}

.create-form h3 {
  margin: 0 0 24px;
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.inline-input {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  width: 150px;
  transition: all 0.3s ease;
}

.inline-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.categories-table {
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

.actions-cell {
  display: flex;
  gap: 10px;
}

.edit-btn, .save-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.edit-btn:hover, .save-btn:hover {
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

.cancel-btn {
  padding: 8px 16px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.submit-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}
</style>

