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
                <button @click="handleUpdate(tag.id)" class="save-btn">保存</button>
                <button @click="cancelEdit" class="cancel-btn">取消</button>
              </template>
              <template v-else>
                <button @click="startEdit(tag)" class="edit-btn">编辑</button>
                <button @click="handleDelete(tag.id)" class="delete-btn">删除</button>
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
    alert('获取标签失败');
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!newTag.value.name || !newTag.value.slug) {
    alert('请填写名称和标识');
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
    alert('创建成功');
  } catch (error) {
    console.error('创建失败:', error);
    alert('创建失败');
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
    alert('请填写名称和标识');
    return;
  }

  try {
    await apiAdminTags.update(id, {
      name: editForm.value.name,
      slug: editForm.value.slug,
    });
    await fetchTags();
    cancelEdit();
    alert('更新成功');
  } catch (error) {
    console.error('更新失败:', error);
    alert('更新失败');
  }
};

const handleDelete = async (id) => {
  if (!confirm('确定要删除这个标签吗？')) return;

  try {
    await apiAdminTags.delete(id);
    await fetchTags();
    alert('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
};

onMounted(() => {
  fetchTags();
});
</script>

<style scoped>
/* 全新明亮设计 - 整体明亮，边框浅色 */
.admin-tags {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
  background: #ffffff;
}

.tags-header h2 {
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

.tags-table {
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

