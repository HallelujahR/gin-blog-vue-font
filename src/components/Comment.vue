<template>
  <div>
    <div v-for="comment in comments" :key="comment.id" class="comment">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-weight:700;color:#1e293b;font-size:15px;">{{ comment.author_name }}</span>
        <span style="font-size:12px;color:#64748b;">{{ formatDate(comment.created_at) }}</span>
      </div>
      <div style="margin:6px 0 8px 0;color:#334155;">{{ comment.content }}</div>
      <button style="font-size:13px;padding:6px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea 0%, #93a5ff 100%);color:#fff;" @click="replying = comment.id">回复</button>
      <div v-if="replying === comment.id" style="margin-top:8px;">
        <textarea v-model="replyContent" placeholder="写下你的回复..." rows="2"/>
        <button @click="doReply(comment.id)" style="margin-left:10px;">提交回复</button>
        <button style="margin-left:4px;background:#929ecc;" @click="cancelReply">取消</button>
      </div>
      <div v-if="comment.children && comment.children.length" style="margin-left:21px;border-left:3px solid #eef2f7;padding-left:14px;margin-top:11px;">
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
