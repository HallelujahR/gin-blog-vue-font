<template>
  <div style="padding:32px 2px;min-height:200px;">
    <h1>关于我</h1>
    <p style="font-size:18px;color:var(--text);max-width:600px;margin:24px 0 16px 6px;">你好，这里是我的个人博客，我热爱前端、全栈开发与技术分享。希望大家能在这里获得启发与乐趣。</p>
    <button @click="goResume" style="margin-left:6px;">我的简历</button>
  </div>
</template>
<script setup>
const RESUME_URL = 'https://example.com/my-resume.pdf';
function goResume(){
  window.open(RESUME_URL, '_blank');
}
</script>
