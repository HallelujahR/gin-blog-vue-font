<template>
  <div class="confirm-root" v-if="confirms.length">
    <div class="backdrop"></div>
    <div class="dialog" role="dialog" aria-modal="true">
      <h3 class="title">{{ confirms[0].title }}</h3>
      <div class="content">{{ confirms[0].message }}</div>
      <div class="actions">
        <button class="btn cancel" @click="resolveConfirm(confirms[0].id, false)">{{ confirms[0].cancelText }}</button>
        <button class="btn ok" @click="resolveConfirm(confirms[0].id, true)">{{ confirms[0].okText }}</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { confirms, resolveConfirm } from '../../utils/confirm';
</script>
<style scoped>
.confirm-root {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
}
.backdrop {
  position: absolute; inset: 0; background: rgba(15,23,42,.45);
}
.dialog {
  position: relative;
  width: min(92vw, 420px);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 18px 16px;
  box-shadow: 0 18px 48px rgba(2,6,23,.25);
}
.title { margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: 700; }
.content { color: #4b5563; font-size: 14px; margin-bottom: 14px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn { padding: 8px 14px; border-radius: 10px; font-size: 13px; cursor: pointer; border: 1px solid #e5e7eb; background: #fff; color: #374151; }
.btn.cancel:hover { background: #f3f4f6; }
.btn.ok { border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; box-shadow: 0 4px 12px rgba(102,126,234,.3); }
.btn.ok:hover { filter: brightness(0.95); }
</style>


