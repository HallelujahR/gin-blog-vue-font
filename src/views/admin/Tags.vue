<template>
  <div class="admin-page-shell">
    <div class="admin-page-head">
      <div>
        <p class="admin-page-subtitle">结构管理</p>
        <h2 class="admin-page-title">标签索引</h2>
      </div>
      <button @click="showCreateForm = !showCreateForm" class="admin-btn">
        {{ showCreateForm ? '收起表单' : '新建标签' }}
      </button>
    </div>

    <div class="admin-toolbar">
      <div class="admin-toolbar-left">
        <span class="admin-statline">用于文章主题和内容检索</span>
      </div>
      <div class="admin-toolbar-right">
        <span class="admin-statline">共 {{ tags.length }} 个标签</span>
      </div>
    </div>

    <div v-if="showCreateForm" class="admin-panel">
      <div class="admin-panel-head">
        <h3 class="admin-panel-title">新建标签</h3>
      </div>
      <div class="admin-panel-body">
        <div class="admin-form-row">
          <input v-model="newTag.name" type="text" placeholder="标签名称" class="admin-input" />
          <input v-model="newTag.slug" type="text" placeholder="标签标识 slug" class="admin-input" />
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
          <tr v-for="tag in tags" :key="tag.id">
            <td>#{{ tag.id }}</td>
            <td>
              <input v-if="editingId === tag.id" v-model="editForm.name" type="text" class="admin-input" />
              <div v-else class="admin-cell-title">{{ tag.name }}</div>
            </td>
            <td>
              <input v-if="editingId === tag.id" v-model="editForm.slug" type="text" class="admin-input" />
              <span v-else>{{ tag.slug }}</span>
            </td>
            <td>
              <div class="admin-inline-actions">
                <template v-if="editingId === tag.id">
                  <button @click="handleUpdate(tag.id)" class="admin-mini-btn">保存</button>
                  <button @click="cancelEdit" class="admin-mini-btn">取消</button>
                </template>
                <template v-else>
                  <button @click="startEdit(tag)" class="admin-mini-btn">编辑</button>
                  <button @click="handleDelete(tag.id)" class="admin-mini-btn danger">删除</button>
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
    <div v-else-if="tags.length === 0" class="admin-panel">
      <div class="admin-panel-body">暂无标签。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiAdminTags } from '../../api/admin.js';
import { apiMeta } from '../../api/index.js';
import { showToast } from '../../utils/toast';
import { confirm as askConfirm } from '../../utils/confirm';

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

const handleDelete = async (id) => {
  const ok = await askConfirm('确定要删除这个标签吗？', {
    title: '删除标签确认',
    okText: '删除',
    cancelText: '取消',
    type: 'warn',
  });
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
</style>
