<template>
  <div class="toast-wrap">
    <transition-group name="toast" tag="div">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <span class="dot" />
        <span class="msg">{{ t.message }}</span>
        <button class="close" @click="dismissToast(t.id)">×</button>
      </div>
    </transition-group>
  </div>
  </template>
  <script setup>
  import { toasts, dismissToast } from '../../utils/toast';
  </script>
  <style scoped>
  .toast-wrap {
    position: fixed;
    right: 16px;
    top: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .toast-enter-active, .toast-leave-active { transition: all .18s ease; }
  .toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-6px); }
  .toast {
    pointer-events: auto;
    min-width: 260px;
    max-width: 380px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-left-width: 4px;
    border-radius: 10px;
    padding: 10px 12px 10px 10px;
    display: grid;
    grid-template-columns: 10px 1fr auto;
    align-items: center;
    box-shadow: 0 6px 18px rgba(17,24,39,.08);
    color: #111827;
  }
  .toast .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    margin-right: 8px;
  }
  .toast .msg { font-size: 13px; line-height: 1.5; padding: 0 6px; }
  .toast .close {
    appearance: none;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 16px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .toast .close:hover { background: #f3f4f6; color: #111827; }
  .toast.info   { border-left-color: #3b82f6; }
  .toast.info   .dot { background: #3b82f6; }
  .toast.success{ border-left-color: #10b981; }
  .toast.success .dot { background: #10b981; }
  .toast.error  { border-left-color: #ef4444; }
  .toast.error  .dot { background: #ef4444; }
  .toast.warn   { border-left-color: #f59e0b; }
  .toast.warn   .dot { background: #f59e0b; }
  </style>
  

