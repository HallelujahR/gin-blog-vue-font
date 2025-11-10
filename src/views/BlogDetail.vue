<template>
  <div>
    <div class="detail-card">
      <img v-if="blog.cover_image" :src="blog.cover_image" class="detail-cover" alt="cover" />
      <div class="detail-header">
        <div>
          <span v-for="cat in (blog.categories || [])" :key="cat.id" class="blog-card-tag">{{ cat.name }}</span>
        </div>
        <div class="blog-card-date">{{ formatDate(blog.published_at || blog.created_at) }}</div>
      </div>
      <h1>{{ blog.title }}</h1>
      <div class="detail-meta-tags">
        <router-link 
          v-for="cat in (blog.categories || [])" 
          :key="cat.id" 
          :to="{ name: 'Home', query: { category: cat.slug || cat.id } }"
          class="detail-meta-chip detail-category-chip"
        >
          {{ cat.name }}
        </router-link>
        <router-link 
          v-for="tag in (blog.tags || [])" 
          :key="tag.id" 
          :to="{ name: 'Home', query: { tag: tag.slug || tag.id } }"
          class="detail-meta-chip detail-tag-chip"
        >
          #{{ tag.name }}
        </router-link>
      </div>
      <v-md-preview :text="blog.content || ''" class="detail-markdown" />
      <div class="detail-stats">
        <button @click="toggleLike" class="stat-btn">
          <span class="stat-icon">👍</span>
          <span class="stat-text">点赞 {{ likeCount }}</span>
        </button>
        <span class="stat-btn stat-view">
          <span class="stat-icon">👁️</span>
          <span class="stat-text">浏览 {{ viewCount }}</span>
        </span>
      </div>
    </div>
    <div class="detail-comment-box">
      <h2>评论</h2>
      <Comment :comments="comments" @reply="handleReply" />
      <input v-model="authorName" placeholder="你的名字" class="comment-input" />
      <input v-model="authorEmail" placeholder="你的邮箱" class="comment-input" />
      <textarea v-model="newComment" placeholder="写下你的评论..."/>
      <button @click="submitComment">发表评论</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiPosts, apiComments, apiLike, apiMeta } from '../api';
import Comment from '../components/Comment.vue';

const route = useRoute();
const blog = ref({});
const comments = ref([]);
const newComment = ref('');
const authorName = ref('访客');
const authorEmail = ref('guest@example.com');
const likeCount = ref(0);
const viewCount = ref(0);
const fakeUserId = 1; // 可替换为真实登录用户ID

// 存储所有分类和标签，用于匹配slug
const allCategories = ref([]);
const allTags = ref([]);

const formatDate = (dateStr)=>{
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' });
};

const fetchBlog = async () => {
  const id = route.params.id;
  const res = await apiPosts.detail(id);
  const post = res.data.post || {};
  
  // 处理分类和标签：优先使用 category_names/tag_names，如果没有则使用 categories/tags
  let categories = [];
  if (post.category_names && Array.isArray(post.category_names)) {
    // 后端返回了 category_names 数组，需要组合成对象数组并匹配slug
    const ids = (post.category_ids && Array.isArray(post.category_ids)) ? post.category_ids : [];
    for (let i = 0; i < post.category_names.length; i++) {
      if (post.category_names[i]) {
        const catId = ids[i] || (i + 1);
        // 从所有分类中查找对应的slug
        const matchedCat = allCategories.value.find(c => c.id === catId || c.name === post.category_names[i]);
        categories.push({
          id: catId,
          name: post.category_names[i],
          slug: matchedCat?.slug || ''
        });
      }
    }
  } else if (post.categories && Array.isArray(post.categories)) {
    // 如果已经是对象数组，直接使用（确保有slug）
    categories = post.categories.map(cat => {
      if (!cat.slug) {
        const matchedCat = allCategories.value.find(c => c.id === cat.id || c.name === cat.name);
        return { ...cat, slug: matchedCat?.slug || '' };
      }
      return cat;
    });
  }
  
  let tags = [];
  if (post.tag_names && Array.isArray(post.tag_names)) {
    // 后端返回了 tag_names 数组，需要组合成对象数组并匹配slug
    const ids = (post.tag_ids && Array.isArray(post.tag_ids)) ? post.tag_ids : [];
    for (let i = 0; i < post.tag_names.length; i++) {
      if (post.tag_names[i]) {
        const tagId = ids[i] || (i + 1);
        // 从所有标签中查找对应的slug
        const matchedTag = allTags.value.find(t => t.id === tagId || t.name === post.tag_names[i]);
        tags.push({
          id: tagId,
          name: post.tag_names[i],
          slug: matchedTag?.slug || ''
        });
      }
    }
  } else if (post.tags && Array.isArray(post.tags)) {
    // 如果已经是对象数组，直接使用（确保有slug）
    tags = post.tags.map(tag => {
      if (!tag.slug) {
        const matchedTag = allTags.value.find(t => t.id === tag.id || t.name === tag.name);
        return { ...tag, slug: matchedTag?.slug || '' };
      }
      return tag;
    });
  }
  
  blog.value = {
    ...post,
    categories: categories,
    tags: tags
  };
  
  // 获取浏览量
  viewCount.value = blog.value.view_count || 0;
};

// 获取所有分类和标签（用于匹配slug）
const fetchAllCategoriesAndTags = async () => {
  try {
    const [catRes, tagRes] = await Promise.all([
      apiMeta.categories(),
      apiMeta.tags()
    ]);
    allCategories.value = catRes.data?.categories || catRes.data || [];
    allTags.value = tagRes.data?.tags || tagRes.data || [];
  } catch (error) {
    console.error('获取分类或标签失败:', error);
  }
};
function buildTree(flat) {
  const byId = new Map();
  flat.forEach(c => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  byId.forEach(c => {
    if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id).children.push(c); else roots.push(c);
  });
  return roots;
}

const fetchComments = async () => {
  const id = route.params.id;
  const commentRes = await apiComments.listByPost(id);
  const flat = (commentRes.data.comments || []).map(c => ({ id: c.id, content: c.content, author_name: c.author_name, created_at: c.created_at, parent_id: c.parent_id }));
  comments.value = buildTree(flat);
};
const fetchLikeCount = async () => {
  const id = route.params.id;
  const res = await apiLike.countForPost(id);
  likeCount.value = res.data.count || 0;
};

onMounted(async () => {
  // 先获取所有分类和标签，用于匹配slug
  await fetchAllCategoriesAndTags();
  await fetchBlog();
  await Promise.all([fetchComments(), fetchLikeCount()]);
});

const submitComment = async () => {
  if (!newComment.value.trim()) return;
  const id = Number(route.params.id);
  await apiComments.create({ content: newComment.value, author_name: authorName.value || '访客', author_email: authorEmail.value || 'guest@example.com', post_id: id });
  await fetchComments();
  newComment.value = '';
};
function handleReply(content, parentId) {
  if (!content.trim()) return;
  const id = Number(route.params.id);
  apiComments.create({ content, author_name: authorName.value || '访客', author_email: authorEmail.value || 'guest@example.com', post_id: id, parent_id: parentId }).then(fetchComments);
}
async function toggleLike() {
  const id = Number(route.params.id);
  await apiLike.toggleForPost(fakeUserId, id);
  await fetchLikeCount();
}
</script>
<style scoped>
.detail-card { background: var(--card); color: var(--text); border: none; border-radius:14px; box-shadow:0 6px 18px rgba(17,24,39,.06); padding:32px; margin-bottom:26px; }
.detail-card h1 { font-size:2.2rem; color: var(--text); margin:12px 0 12px 2px; }
.detail-cover { width:100%; max-height:330px; object-fit:cover; margin-bottom:18px; border-radius:11px; }
.detail-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.blog-card-tag { background: var(--chip); border:1px solid var(--chip-border); color: var(--text); font-size:13px; padding:3px 12px; border-radius:8px; margin-right:10px; font-weight:600; }
.blog-card-date { font-size:15px; color:#8192a8; }
.detail-meta-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 16px 0 24px 2px; }
.detail-meta-chip { display: inline-block; background: #f3f6ff; border: 1px solid #e4ecff; color: #4f46e5; font-size: 12px; padding: 4px 10px; border-radius: 999px; font-weight: 500; text-decoration: none; transition: all 0.2s ease; }
.detail-meta-chip:hover { background: #e0e7ff; border-color: #c7d2fe; color: #3730a3; transform: translateY(-1px); }
.detail-markdown { color: #334155; font-size:17px; line-height:1.95; background:#ffffff; border-radius:10px; padding:22px 24px; border:1px solid #eef2f7; margin-bottom: 20px; }
.detail-stats { display: flex; align-items: center; gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eef2f7; }
.stat-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: transparent; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.2s ease; font-weight: 500; line-height: 1.5; }
.stat-btn:hover { color: #475569; }
.stat-btn.stat-view { cursor: default; }
.stat-btn.stat-view:hover { color: #64748b; }
.stat-icon { font-size: 14px; line-height: 1; }
.stat-text { font-size: 13px; line-height: 1.5; }
.detail-comment-box { margin-top: 22px; background:#ffffff; border-radius:12px; padding:22px; color: var(--text); border:1px solid #eef2f7; }
.comment-input { width:100%; margin:8px 0; padding:10px 12px; border-radius:10px; border:1px solid #e6eef6; background:#fff; color:#1e293b; }
.detail-comment-box h2 { color:#1e293b; }
</style>
