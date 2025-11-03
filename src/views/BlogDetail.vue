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
      <div class="like-row">
        <button @click="toggleLike" class="like-btn">👍 点赞 {{ likeCount }}</button>
      </div>
      <div v-html="blog.content" class="detail-markdown" />
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
import { apiPosts, apiComments, apiLike } from '../api';
import Comment from '../components/Comment.vue';

const route = useRoute();
const blog = ref({});
const comments = ref([]);
const newComment = ref('');
const authorName = ref('访客');
const authorEmail = ref('guest@example.com');
const likeCount = ref(0);
const fakeUserId = 1; // 可替换为真实登录用户ID

const formatDate = (dateStr)=>{
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' });
};

const fetchBlog = async () => {
  const id = route.params.id;
  const res = await apiPosts.detail(id);
  blog.value = res.data.post || {};
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
.detail-markdown { color: #334155; font-size:17px; line-height:1.95; background:#ffffff; border-radius:10px; padding:22px 24px; border:1px solid #eef2f7; }
.detail-comment-box { margin-top: 22px; background:#ffffff; border-radius:12px; padding:22px; color: var(--text); border:1px solid #eef2f7; }
.comment-input { width:100%; margin:8px 0; padding:10px 12px; border-radius:10px; border:1px solid #e6eef6; background:#fff; color:#1e293b; }
.like-row { display:flex; justify-content:flex-end; margin: 6px 0 14px; }
.like-btn { background: linear-gradient(135deg, #667eea 0%, #93a5ff 100%); border:none; color:#fff; border-radius:10px; padding:10px 16px; box-shadow:0 4px 12px rgba(102,126,234,.25); }
.detail-comment-box h2 { color:#1e293b; }
</style>
