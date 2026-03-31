/**
 * Resize an image File to max 1024px on the longest side and re-encode
 * as JPEG at 0.88 quality. Returns a new File ready for upload / AI processing.
 */
export async function optimizeImage(
  source: File,
  maxPx = 1024,
  quality = 0.88,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const outW = Math.round(w * scale);
      const outH = Math.round(h * scale);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }
          // Preserve a meaningful filename
          const baseName = source.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}-opt.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para optimizarla.'));
    };

    img.src = objectUrl;
  });
}
