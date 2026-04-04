import { useRef, useState, useCallback } from 'react';
import { ImageIcon, Lock, Lightbulb, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../ui/Button';
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

  const [readyFile, setReadyFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Process a raw File: validate → optimise → set preview ──────────────

  const processFile = useCallback(async (raw: File) => {
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
  }, []);

  // ── Gallery file input ─────────────────────────────────────────────────

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected
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

  // ── Reset ──────────────────────────────────────────────────────────────

  const resetPhoto = () => {
    setPreview(null);
    setReadyFile(null);
    setLocalError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const hasPhoto = Boolean(preview);

  return (
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
          Sube una foto para ver cómo quedarías con tu tratamiento favorito.
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
                <ImageIcon size={14} className="text-white" strokeWidth={2} />
              </div>
            </div>
            <p className="font-sans text-sm font-medium text-charcoal-light">
              Toca para subir tu foto
            </p>
            <p className="font-sans text-xs text-muted">
              JPG, PNG, WebP · cámara o galería · máx. 10 MB
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
        <Button
          variant="secondary"
          size="md"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} />
          Subir foto
        </Button>
      ) : (
        /* Post-selection actions */
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

      {/* Hidden file input — on mobile opens camera or gallery */}
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
  );
}
