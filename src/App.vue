<template>
  <div>
    <nav style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <router-link to="/">博客首页</router-link> |
        <router-link to="/about">关于我</router-link>
      </div>

    </nav>
    <router-view />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

const theme = ref('dark');


function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
}
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  applyTheme(theme.value);
}
onMounted(() => {
  const saved = localStorage.getItem('theme');
  theme.value = saved || 'dark';
  applyTheme(theme.value);
});
</script>
