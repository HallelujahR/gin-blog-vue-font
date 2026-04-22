<template>
  <div class="app-shell">
    <div class="app-content">
      <router-view />
    </div>
    <!-- 全局提示 -->
    <ToastContainer />
    <ConfirmContainer />
  </div>
</template>

<script setup>
import ToastContainer from './components/admin/ToastContainer.vue';
import ConfirmContainer from './components/admin/ConfirmContainer.vue';
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-content {
  flex: 1;
}
</style>
