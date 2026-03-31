import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, ImageIcon, X, RotateCcw, Lock, Lightbulb, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../ui/Button';
import { useCamera } from '../../hooks/useCamera';
import { optimizeImage } from '../../utils/imageOptimizer';

// ── Types ──────────────────────────────────────────────────────────────────

interface Step1PhotoProps {
  onComplete: (file: File, previewUrl: string) => void;
  /** Existing preview URL when user navigates back from step 2 */
  initialPreviewUrl?: string | null;
}

// ── Validation ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type.toLowerCase())) {
    return 'Formato no compatible. Usa JPG, PNG o WebP.';
  }
  if (file.size > MAX_BYTES) {
    return 'La imagen es demasiado grande. Máximo 10 MB.';
  }
  return null;
}

// ── Main component ─────────────────────────────────────────────────────────

export function Step1Photo({ onComplete, initialPreviewUrl }: Step1PhotoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Holds the optimised File while user reviews it in the camera modal
  const pendingCaptureRef = useRef<{ file: File; url: string } | null>(null);

  // Optimised file ready to pass to onComplete when user taps Continuar
  const [readyFile, setReadyFile] = useState<File | null>(null);
  // Local photo preview (before calling onComplete which advances the step)
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Camera modal visibility
  const [cameraOpen, setCameraOpen] = useState(false);

  const camera = useCamera();

  // Lock body scroll when camera modal is open
  useEffect(() => {
    if (cameraOpen) {
      document.body.classList.add('camera-open');
    } else {
      document.body.classList.remove('camera-open');
    }
    return () => document.body.classList.remove('camera-open');
  }, [cameraOpen]);

  // ── Process a raw File: validate → optimise → set preview ──────────────

  const processFile = useCallback(
    async (raw: File) => {
      const err = validateFile(raw);
      if (err) {
        setLocalError(err);
        return;
      }
      setLocalError(null);
      setIsProcessing(true);

      try {
        const isHeic =
          raw.type === 'image/heic' ||
          raw.type === 'image/heif' ||
          raw.name.toLowerCase().endsWith('.heic') ||
          raw.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
          // Pass through — Gemini handles HEIC natively
          const url = URL.createObjectURL(raw);
          setPreview(url);
          setReadyFile(raw);
          return;
        }

        const optimised = await optimizeImage(raw);
        const url = URL.createObjectURL(optimised);
        setPreview(url);
        setReadyFile(optimised);
      } catch {
        setLocalError('No pudimos procesar la imagen. Intenta con otra foto.');
      } finally {
        setIsProcessing(false);
      }
    },
    // onComplete intentionally excluded: processFile only prepares; Continuar fires it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Gallery file input ─────────────────────────────────────────────────

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset value so the same file can be re-selected
    e.target.value = '';
  };

  // ── Drag and drop ──────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // ── Camera modal actions ───────────────────────────────────────────────

  const openCamera = useCallback(async () => {
    setCameraOpen(true);
    await camera.start();
  }, [camera]);

  const closeCamera = useCallback(() => {
    camera.stop();
    setCameraOpen(false);
  }, [camera]);

  const handleCapture = useCallback(async () => {
    const raw = await camera.capture();
    if (!raw) return;
    // Optimise to consistent 1024px JPEG (camera.capture already scales, but run
    // through our pipeline for uniform output)
    const optimised = await optimizeImage(raw);
    const url = URL.createObjectURL(optimised);
    pendingCaptureRef.current = { file: optimised, url };
  }, [camera]);

  const confirmCapture = useCallback(() => {
    const previewUrl = camera.capturePreviewUrl ?? pendingCaptureRef.current?.url ?? null;
    const file = pendingCaptureRef.current?.file ?? null;
    if (!file || !previewUrl) return;

    setPreview(previewUrl);
    setReadyFile(file);
    pendingCaptureRef.current = null;
    setCameraOpen(false);
    camera.stop();
  }, [camera]);

  const handleRetake = useCallback(async () => {
    await camera.retake();
  }, [camera]);

  // ── Reset ──────────────────────────────────────────────────────────────

  const resetPhoto = () => {
    setPreview(null);
    setReadyFile(null);
    setLocalError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const hasPhoto = Boolean(preview);

  return (
    <>
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-10 max-w-md mx-auto w-full">

        {/* ── Header ── */}
        <div className="text-center mb-7">
          <h1
            className="text-[32px] sm:text-[40px] leading-tight text-charcoal mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            Descubre tu mejor versión
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted leading-relaxed max-w-xs mx-auto">
            Sube una foto o toma una selfie para ver cómo quedarías con tus tratamientos favoritos.
          </p>
          <p className="mt-3 font-sans text-xs text-gold flex items-center justify-center gap-1.5">
            <Lock size={11} />
            Tu imagen es privada y se elimina automáticamente
          </p>
        </div>

        {/* ── Photo zone ── */}
        <div className="w-full mb-5">
          {!hasPhoto ? (
            /* Empty — invite tap with pulse */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              aria-label="Subir foto desde galería"
              className={clsx(
                'photo-zone-pulse',
                'w-full rounded-[var(--radius)] border-2 border-dashed border-gold-light',
                'bg-gold-pale/30 hover:bg-gold-pale/50 hover:border-gold',
                'flex flex-col items-center justify-center gap-4',
                'transition-colors duration-200 cursor-pointer',
                'aspect-[4/5] max-h-[420px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              )}
            >
              {/* Stacked icons */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-gold-pale flex items-center justify-center">
                  <UserRound size={32} className="text-gold-light" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-[var(--shadow-gold)]">
                  <Camera size={14} className="text-white" strokeWidth={2} />
                </div>
              </div>
              <p className="font-sans text-sm font-medium text-charcoal-light">
                Toca para subir o tomar selfie
              </p>
              <p className="font-sans text-xs text-muted">
                JPG, PNG, WebP — máx. 10 MB
              </p>
            </button>
          ) : (
            /* Preview */
            <div className="fade-up w-full relative rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-soft)]">
              <img
                src={preview!}
                alt="Tu foto seleccionada para la simulación"
                className="w-full object-cover aspect-[4/5] max-h-[420px]"
              />
              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-cream/70 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-sans text-xs text-charcoal">Optimizando imagen…</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        {!hasPhoto ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              onClick={openCamera}
              aria-label="Abrir cámara frontal para selfie"
            >
              <Camera size={16} />
              Tomar selfie
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={16} />
              Subir desde galería
            </Button>
          </div>
        ) : (
          /* Post-selection actions — fade in */
          <div className="fade-up w-full flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isProcessing || !readyFile}
              onClick={() => {
                if (readyFile && preview) onComplete(readyFile, preview);
              }}
            >
              {isProcessing ? 'Procesando…' : 'Continuar →'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full text-muted"
              onClick={resetPhoto}
              disabled={isProcessing}
            >
              Cambiar foto
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={handleFileInput}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* ── Error message ── */}
        {localError && (
          <p
            role="alert"
            className="fade-up mt-4 font-sans text-sm text-red-600 text-center bg-red-50 border border-red-100 rounded-[var(--radius-sm)] px-4 py-2.5 w-full"
          >
            {localError}
          </p>
        )}

        {/* ── Tips (visible after photo selected) ── */}
        {hasPhoto && !isProcessing && (
          <div className="fade-up mt-6 flex items-start gap-2.5 bg-gold-pale/60 rounded-[var(--radius-sm)] px-4 py-3 w-full">
            <Lightbulb size={14} className="text-gold mt-0.5 flex-shrink-0" />
            <p className="font-sans text-xs text-charcoal-light leading-relaxed">
              <span className="font-medium text-charcoal">Mejor resultado</span> con buena
              iluminación, fondo neutral y cara centrada y sin accesorios.
            </p>
          </div>
        )}
      </main>

      {/* ── Camera modal ── */}
      {cameraOpen && (
        <CameraModal
          camera={camera}
          onCapture={handleCapture}
          onConfirm={confirmCapture}
          onRetake={handleRetake}
          onClose={closeCamera}
        />
      )}
    </>
  );
}

// ── Camera modal sub-component ─────────────────────────────────────────────

interface CameraModalProps {
  camera: ReturnType<typeof useCamera>;
  onCapture: () => Promise<void>;
  onConfirm: () => void;
  onRetake: () => Promise<void>;
  onClose: () => void;
}

function CameraModal({ camera, onCapture, onConfirm, onRetake, onClose }: CameraModalProps) {
  const { status, videoRef, capturePreviewUrl, errorMessage } = camera;
  const isCaptured = status === 'captured';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tomar selfie"
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 z-10">
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-sm text-white/80 hover:text-white transition-colors min-h-[44px] px-2 flex items-center gap-1.5"
          aria-label="Cancelar y cerrar cámara"
        >
          <X size={16} />
          Cancelar
        </button>
        <p className="font-sans text-xs text-white/60 tracking-wide uppercase">
          Selfie
        </p>
        <div className="w-20" aria-hidden="true" />
      </div>

      {/* ── Video / Preview area ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={clsx(
            'w-full h-full object-cover',
            // Mirror the video so it feels like a natural selfie
            'scale-x-[-1]',
            isCaptured && 'hidden',
          )}
          aria-hidden="true"
        />

        {/* Captured snapshot preview */}
        {isCaptured && capturePreviewUrl && (
          <img
            src={capturePreviewUrl}
            alt="Vista previa de la foto capturada"
            className="w-full h-full object-cover"
          />
        )}

        {/* ── Circular crop guide overlay (live mode only) ── */}
        {!isCaptured && status === 'active' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darken corners while keeping circle transparent */}
            <div
              className="w-[72vw] max-w-[320px] aspect-square rounded-full"
              style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                border: '2px solid rgba(201,169,110,0.7)',
              }}
            />
            <p className="absolute bottom-[28%] font-sans text-xs text-white/70">
              Centra tu rostro
            </p>
          </div>
        )}

        {/* ── Loading / requesting state ── */}
        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-sans text-sm text-white/80">Activando cámara…</p>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
            <div className="text-center space-y-4">
              <p className="font-sans text-sm text-white/90 leading-relaxed">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="font-sans text-sm text-gold underline underline-offset-2 min-h-[44px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="px-6 pb-safe-bottom pb-8 pt-5 flex items-center justify-center gap-6">
        {!isCaptured ? (
          /* Capture button */
          <button
            type="button"
            onClick={onCapture}
            disabled={status !== 'active'}
            aria-label="Capturar foto"
            className={clsx(
              'w-20 h-20 rounded-full border-4 border-white',
              'flex items-center justify-center',
              'transition-all duration-150 active:scale-95',
              status === 'active'
                ? 'bg-white cursor-pointer shadow-lg'
                : 'bg-white/30 cursor-not-allowed',
            )}
          >
            <div
              className={clsx(
                'w-14 h-14 rounded-full transition-colors duration-150',
                status === 'active' ? 'bg-gold' : 'bg-white/40',
              )}
            />
          </button>
        ) : (
          /* Post-capture: Confirm or retake */
          <div className="w-full flex gap-3">
            <button
              type="button"
              onClick={onRetake}
              className="flex-1 flex items-center justify-center gap-2 font-sans text-sm text-white/80 hover:text-white border border-white/30 rounded-full py-3 min-h-[52px] transition-colors"
            >
              <RotateCcw size={15} />
              Volver a tomar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 font-sans text-sm font-medium bg-gold text-charcoal rounded-full py-3 min-h-[52px] hover:bg-gold-light transition-colors shadow-[var(--shadow-gold)]"
            >
              Usar esta foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
