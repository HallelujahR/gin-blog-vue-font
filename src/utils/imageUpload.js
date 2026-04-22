const DEFAULT_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  minSizeForCompress: 300 * 1024,
};

const BYPASS_TYPES = new Set(['image/gif', 'image/svg+xml']);

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('图片压缩失败'));
      }
    }, type, quality);
  });
}

function getScaledSize(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
    changed: ratio < 1,
  };
}

export function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export async function optimizeImageFile(file, options = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (BYPASS_TYPES.has(file.type)) return file;

  const settings = { ...DEFAULT_OPTIONS, ...options };
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const { width, height, changed } = getScaledSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      settings.maxWidth,
      settings.maxHeight,
    );

    const shouldCompress = changed || file.size >= settings.minSizeForCompress;
    if (!shouldCompress) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: file.type === 'image/png' });
    if (!ctx) {
      throw new Error('浏览器不支持图片压缩');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);

    const outputType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ? file.type
      : 'image/jpeg';

    const blob = await canvasToBlob(canvas, outputType, settings.quality);
    if (blob.size >= file.size && !changed) {
      return file;
    }

    return new File([blob], file.name, {
      type: blob.type || file.type,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
