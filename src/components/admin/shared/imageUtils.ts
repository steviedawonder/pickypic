// Image compression utility for client-side image optimization before upload.
// Target: under 1MB, using canvas API with progressive quality reduction.

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_DIMENSION = 2400; // Max width/height in pixels
const INITIAL_QUALITY = 0.9;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.3;

/**
 * Compress an image file to under 1MB using canvas resizing + JPEG quality reduction.
 * Preserves aspect ratio. Non-image files are returned as-is.
 * Returns a new File object (or the original if already small enough).
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  // Skip SVGs (cannot compress via canvas)
  if (file.type === 'image/svg+xml') return file;

  // If already under limit, no compression needed
  if (file.size <= MAX_FILE_SIZE) return file;

  // Load image into canvas
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);

  // Progressively reduce quality until under 1MB
  let quality = INITIAL_QUALITY;
  let blob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob && blob.size <= MAX_FILE_SIZE) break;
    quality -= QUALITY_STEP;
  }

  // If still too large after min quality, scale down further
  if (blob && blob.size > MAX_FILE_SIZE) {
    let scale = 0.8;
    while (scale >= 0.3 && blob && blob.size > MAX_FILE_SIZE) {
      const scaledW = Math.round(width * scale);
      const scaledH = Math.round(height * scale);
      canvas.width = scaledW;
      canvas.height = scaledH;
      ctx.drawImage(img, 0, 0, scaledW, scaledH);
      blob = await canvasToBlob(canvas, 'image/jpeg', MIN_QUALITY);
      scale -= 0.1;
    }
  }

  if (!blob) return file;

  // Preserve original filename but change extension to .jpg
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(origW: number, origH: number): { width: number; height: number } {
  if (origW <= MAX_DIMENSION && origH <= MAX_DIMENSION) {
    return { width: origW, height: origH };
  }
  const ratio = Math.min(MAX_DIMENSION / origW, MAX_DIMENSION / origH);
  return {
    width: Math.round(origW * ratio),
    height: Math.round(origH * ratio),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(resolve, type, quality);
  });
}
