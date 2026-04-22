<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">结构管理</p>
        <h2 class="admin-page-title">分类目录</h2>
      </div>
      <button @click="showCreateForm = !showCreateForm" class="admin-btn">
        {{ showCreateForm ? '收起表单' : '新建分类' }}
      </button>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">用于组织文章栏目结构</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ categories.length }} 个分类</span>
      </div>
    </div>

    <div v-if="showCreateForm" class="admin-panel">
      <div class="admin-panel-head">
        <h3 class="admin-panel-title">新建分类</h3>
      </div>
      <div class="admin-panel-body">
        <div class="admin-form-row">
          <input v-model="newCategory.name" type="text" placeholder="分类名称" class="admin-input" />
          <input v-model="newCategory.slug" type="text" placeholder="分类标识 slug" class="admin-input" />
        </div>
        <div class="admin-action-row">
          <button @click="handleCreate" class="admin-btn">创建</button>
          <button @click="cancelCreate" class="admin-btn admin-btn-ghost">取消</button>
        </div>
      </div>
    </div>

    <div class="admin-table-shell">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:72px;">ID</th>
            <th>名称</th>
            <th style="width:240px;">Slug</th>
            <th style="width:180px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>#{{ category.id }}</td>
            <td>
              <input v-if="editingId === category.id" v-model="editForm.name" type="text" class="admin-input" />
              <div v-else class="admin-cell-title">{{ category.name }}</div>
            </td>
            <td>
              <input v-if="editingId === category.id" v-model="editForm.slug" type="text" class="admin-input" />
              <span v-else>{{ category.slug }}</span>
            </td>
            <td>
              <div class="admin-inline-actions">
                <template v-if="editingId === category.id">
                  <button @click="handleUpdate(category.id)" class="admin-mini-btn">保存</button>
                  <button @click="cancelEdit" class="admin-mini-btn">取消</button>
                </template>
                <template v-else>
                  <button @click="startEdit(category)" class="admin-mini-btn">编辑</button>
                  <button @click="handleDelete(category.id)" class="admin-mini-btn danger">删除</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="admin-panel">
      <div class="admin-panel-body">加载中...</div>
    </div>
    <div v-else-if="categories.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无分类。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminCategories } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

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

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个分类吗？', {
    title: '删除分类确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
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
</style>
