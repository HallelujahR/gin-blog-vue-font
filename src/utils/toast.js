import { reactive } from 'vue';

export const toasts = reactive([]);

let idSeq = 1;

export function showToast(message, type = 'info', duration = 2200) {
  const id = idSeq++;
  const toast = { id, message, type, visible: true };
  toasts.push(toast);
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id) {
  const idx = toasts.findIndex(t => t.id === id);
  if (idx !== -1) {
    toasts.splice(idx, 1);
  }
}


