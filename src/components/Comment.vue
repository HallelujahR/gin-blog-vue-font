<template>
  <div>
    <div v-for="comment in comments" :key="comment.id" class="comment">
      <div class="comment-header">
        <span class="comment-author">{{ comment.author_name }}</span>
        <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
      </div>
      <div class="comment-body">{{ comment.content }}</div>
      <button class="comment-reply-btn" @click="replying = comment.id">回复</button>
      <div v-if="replying === comment.id" class="comment-reply-form">
        <textarea v-model="replyContent" placeholder="写下你的回复..." rows="2"/>
        <button @click="doReply(comment.id)" class="comment-submit-btn">提交回复</button>
        <button class="comment-cancel-btn" @click="cancelReply">取消</button>
      </div>
      <div v-if="comment.children && comment.children.length" class="comment-children">
        <Comment :comments="comment.children" @reply="$emit('reply',$event, comment.id)"/>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const props = defineProps({ comments: Array });
const emit = defineEmits(['reply']);
const replying = ref(null);
const replyContent = ref('');
function doReply(parentId) {
  if (!replyContent.value.trim()) return;
  emit('reply', replyContent.value, parentId);
  replyContent.value = '';
  replying.value = null;
}
function cancelReply() { replyContent.value=''; replying.value=null; }
function formatDate(dateStr){ if(!dateStr) return ''; const d=new Date(dateStr); return d.toLocaleDateString('en',{month:'short',day:'2-digit',year:'numeric'}); }
</script>
<style scoped>
.comment { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(122, 122, 122, 0.06); }
.comment-header { display: flex; align-items: center; gap: 6px; }
.comment-author { font-weight: 700; color: var(--text); font-size: 15px; }
.comment-date { font-size: 12px; color: var(--muted); }
.comment-body { margin: 6px 0 8px; color: var(--muted); font-size: 14px; }
.comment-reply-btn {
  font-size: 13px;
  padding: 4px 12px;
  border: 1px solid rgba(107, 143, 113, 0.22);
  background: rgba(255, 255, 255, 0.24);
  color: var(--primary-1);
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-top: 0;
  transition: background .18s, color .18s, border-color .18s;
}
.comment-reply-btn:hover { background: rgba(107, 143, 113, 0.08); color: var(--primary-2); border-color: rgba(107, 143, 113, 0.38); }
.comment-reply-form { margin-top: 8px; }
.comment-submit-btn {
  margin-left: 10px;
  border: 1px solid rgba(107, 143, 113, 0.22);
  background: rgba(255, 255, 255, 0.24);
  color: var(--primary-1);
}
.comment-cancel-btn {
  margin-left: 4px;
  border: 1px solid rgba(122, 122, 122, 0.1);
  background: rgba(255, 255, 255, 0.24);
  color: var(--muted);
}
.comment-cancel-btn:hover { background: rgba(122, 122, 122, 0.06); color: var(--text); border-color: rgba(122, 122, 122, 0.16); }
.comment-children {
  margin-left: 20px;
  border-left: 1px solid rgba(122, 122, 122, 0.1);
  padding-left: 14px;
  margin-top: 10px;
}

@media (max-width: 640px) {
  .comment-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
  .comment-submit-btn,
  .comment-cancel-btn {
    margin-left: 0;
    margin-right: 6px;
  }
  .comment-children {
    margin-left: 12px;
    padding-left: 10px;
  }
}
</style>
