import { reactive } from 'vue';

export const confirms = reactive([]);
let seq = 1;

export function confirm(message, options = {}) {
  return new Promise((resolve) => {
    const id = seq++;
    const item = {
      id,
      message,
      title: options.title || '确认操作',
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      type: options.type || 'default',
      resolve,
    };
    confirms.push(item);
  });
}

export function resolveConfirm(id, result) {
  const idx = confirms.findIndex(c => c.id === id);
  if (idx !== -1) {
    const item = confirms[idx];
    confirms.splice(idx, 1);
    item.resolve(!!result);
  }
}


