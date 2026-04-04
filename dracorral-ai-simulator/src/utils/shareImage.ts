/**
 * shareImage.ts
 * Generates a 1080×1080 Instagram-ready before/after canvas and triggers download.
 */

// ── Helper: load an image from any URL (blob:, data:, https:) ─────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin only for remote URLs; blob: and data: don't need it
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para exportar'));
    img.src = url;
  });
}

// ── Helper: draw an image with object-fit: cover semantics ────────────────

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
): void {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const destAspect = destW / destH;

  let srcX = 0;
  let srcY = 0;
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;

  if (imgAspect > destAspect) {
    // Image wider than dest — crop equal sides
    srcW = img.naturalHeight * destAspect;
    srcX = (img.naturalWidth - srcW) / 2;
  } else {
    // Image taller than dest — crop top/bottom equally
    srcH = img.naturalWidth / destAspect;
    srcY = (img.naturalHeight - srcH) / 2;
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
}

// ── Main export ────────────────────────────────────────────────────────────

export async function exportSideBySideImage(
  originalUrl: string,
  generatedUrl: string,
): Promise<void> {
  const [original, generated] = await Promise.all([
    loadImage(originalUrl),
    loadImage(generatedUrl),
  ]);

  // Canvas dimensions — 1080×1080 (Instagram square)
  const W = 1080;
  const H = 1080;
  const TOP_STRIP = 40;
  const BOTTOM_STRIP = 50;
  const IMAGE_H = H - TOP_STRIP - BOTTOM_STRIP; // 990px
  const HALF_W = W / 2;                          // 540px

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Background: cream
  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, 0, W, H);

  // ── Left half — original photo ─────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP_STRIP, HALF_W, IMAGE_H);
  ctx.clip();
  drawImageCover(ctx, original, 0, TOP_STRIP, HALF_W, IMAGE_H);
  ctx.restore();

  // ── Right half — generated photo ──────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(HALF_W, TOP_STRIP, HALF_W, IMAGE_H);
  ctx.clip();
  drawImageCover(ctx, generated, HALF_W, TOP_STRIP, HALF_W, IMAGE_H);
  ctx.restore();

  // ── Divider line between halves ───────────────────────────────────────
  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(HALF_W - 1, TOP_STRIP, 2, IMAGE_H);

  // ── Top strip: "Simulación con IA" ────────────────────────────────────
  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, 0, W, TOP_STRIP);
  ctx.fillStyle = '#3D5230'; // sage-700
  ctx.font = '500 16px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Simulación con IA • Dra. Corral', W / 2, TOP_STRIP / 2);

  // ── Bottom strip: "Dra. Corral · dracorral.cl" ───────────────────────
  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, H - BOTTOM_STRIP, W, BOTTOM_STRIP);
  ctx.fillStyle = '#6B6B6B'; // text-muted
  ctx.font = '400 14px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Dra. Corral · dracorral.cl', W / 2, H - BOTTOM_STRIP / 2);

  // ── ANTES label — bottom-left of left half ───────────────────────────
  const labelY = TOP_STRIP + IMAGE_H - 20; // 20px above bottom of image area
  const labelPadX = 14;
  const labelPadY = 5;
  ctx.font = '500 11px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const antesText = 'ANTES';
  const antesW = ctx.measureText(antesText).width;
  const antesX = 14;
  const antesBoxW = antesW + labelPadX * 2;
  const antesBoxH = 22;

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(antesX - labelPadX, labelY - antesBoxH / 2, antesBoxW, antesBoxH, 100);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#1A1A1A';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(antesText, antesX, labelY);

  // ── DESPUÉS label — bottom-right of right half ───────────────────────
  const despuesText = 'DESPUÉS';
  ctx.font = '500 11px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.letterSpacing = '1.5px';

  const despuesW = ctx.measureText(despuesText).width;
  const despuesX = W - 14;
  const despuesBoxW = despuesW + labelPadX * 2;
  const despuesBoxH = 22;

  ctx.save();
  ctx.fillStyle = '#3D5230'; // sage-700
  ctx.beginPath();
  ctx.roundRect(despuesX - despuesBoxW + labelPadX, labelY - despuesBoxH / 2, despuesBoxW, despuesBoxH, 100);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(despuesText, despuesX - labelPadY, labelY);

  // ── Download ──────────────────────────────────────────────────────────
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulacion-dra-corral.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
