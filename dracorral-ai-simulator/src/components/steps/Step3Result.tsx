import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import { RefreshCw, Share2, Check, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { PROCEDURES } from '../../data/procedures';
import type { ProcedureSelection } from '../../types';
import { Button } from '../ui/Button';

// ── Props ──────────────────────────────────────────────────────────────────

interface Step3ResultProps {
  originalPhotoUrl: string;
  generatedImageUrl: string | null;
  selectedProcedures: ProcedureSelection[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onContinue: () => void;
  onBack: () => void;
}

// ── Loading messages ───────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analizando tu rostro...',
  'Aplicando los tratamientos seleccionados...',
  'Ajustando la iluminación...',
  'Añadiendo los últimos detalles...',
  'Tu resultado está casi listo...',
] as const;

// ── LoadingScreen ──────────────────────────────────────────────────────────

const LoadingScreen = memo(function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgKey, setMsgKey] = useState(0); // force re-mount for animation

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
      setMsgKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-[60vh]"
      style={{ background: 'var(--sage-dark)' }}
    >
      {/* Ripple rings around D|C monogram */}
      <div className="relative flex items-center justify-center mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className={clsx(
              'gold-ripple-ring',
              'absolute w-20 h-20 rounded-full border-2',
            )}
            style={{ borderColor: 'rgba(255,255,255,0.25)' }}
          />
        ))}
        {/* D|C monogram */}
        <div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.1em',
            }}
          >
            D|C
          </span>
        </div>
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center mb-2 overflow-hidden">
        <p
          key={msgKey}
          className="msg-in font-sans text-base font-medium text-center"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {LOADING_MESSAGES[msgIdx]}
        </p>
      </div>

      <p
        className="font-sans text-sm text-center mb-8"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Esto toma aproximadamente 15–20 segundos
      </p>

      {/* Indeterminate progress bar */}
      <div className="w-full max-w-xs">
        <div
          className="progress-indeterminate relative h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          role="progressbar"
          aria-label="Generando imagen"
        />
      </div>
    </div>
  );
});

// ── BeforeAfterSlider (mobile) ─────────────────────────────────────────────

interface SliderProps {
  beforeUrl: string;
  afterUrl: string;
}

const BeforeAfterSlider = memo(function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: SliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // 0–100 %
  const isDragging = useRef(false);

  const clamp = (v: number) => Math.max(2, Math.min(98, v));

  const posFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return 50;
    const rect = el.getBoundingClientRect();
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, []);

  // Global mouse events so dragging doesn't break when cursor leaves the box
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPos(posFromClientX(e.clientX));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [posFromClientX]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault(); // stop page scroll while dragging
      setPos(posFromClientX(e.touches[0].clientX));
    },
    [posFromClientX],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[var(--radius)] select-none touch-none cursor-ew-resize"
      style={{ aspectRatio: '3/4', boxShadow: 'var(--shadow-soft)' }}
      onMouseDown={() => { isDragging.current = true; }}
      onTouchStart={(e) => {
        isDragging.current = true;
        setPos(posFromClientX(e.touches[0].clientX));
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { isDragging.current = false; }}
    >
      {/* Before (full size, behind) */}
      <img
        src={beforeUrl}
        alt="Foto original"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After (clipped to left portion) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={afterUrl}
          alt="Simulación del resultado"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
        style={{ left: `calc(${pos}% - 1px)` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center pointer-events-none"
        style={{
          left: `${pos}%`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}
      >
        <span className="text-[10px] text-charcoal-light font-medium select-none leading-none">
          ◀▶
        </span>
      </div>

      {/* ANTES / DESPUÉS labels */}
      <span className="absolute top-3 left-3 font-sans text-[10px] font-semibold tracking-widest text-white uppercase px-2 py-1 rounded bg-black/30 backdrop-blur-sm pointer-events-none">
        ANTES
      </span>
      <span className="absolute top-3 right-3 font-sans text-[10px] font-semibold tracking-widest text-white uppercase px-2 py-1 rounded bg-gold/70 backdrop-blur-sm pointer-events-none">
        DESPUÉS
      </span>
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export function Step3Result({
  originalPhotoUrl,
  generatedImageUrl,
  selectedProcedures,
  isLoading,
  error,
  onRetry,
  onContinue: _onContinue, // reserved for future step; WhatsApp CTA used instead
  onBack,
}: Step3ResultProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [disclaimerDismissing, setDisclaimerDismissing] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAcceptDisclaimer = () => {
    setDisclaimerDismissing(true);
    setTimeout(() => {
      setDisclaimerAccepted(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }, 400);
  };

  const selectedProcsData = selectedProcedures
    .map((sel) => ({
      sel,
      proc: PROCEDURES.find((p) => p.id === sel.id)!,
    }))
    .filter((x) => x.proc != null);

  const handleShare = useCallback(async () => {
    if (!generatedImageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi simulación con Dra. Corral',
          text: 'Mira cómo se vería mi resultado con tratamientos estéticos de armonización facial.',
          url: generatedImageUrl,
        });
      } catch {
        // User cancelled — no action needed
      }
    } else {
      await navigator.clipboard.writeText(generatedImageUrl).catch(() => null);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  }, [generatedImageUrl]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col">
        <LoadingScreen />
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !generatedImageUrl) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-sm mx-auto w-full text-center">
        <div
          className="w-full rounded-[var(--radius)] p-6 space-y-4"
          style={{ background: 'var(--cream-dark)', boxShadow: 'var(--shadow-soft)' }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h2
              className="text-xl text-charcoal mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
            >
              No se pudo generar
            </h2>
            <p className="font-sans text-sm text-muted leading-relaxed">
              {error ?? 'Ocurrió un problema inesperado al generar tu simulación.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 bg-gold text-charcoal font-sans font-medium text-sm rounded-[var(--radius)] py-3 min-h-[44px] hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <RefreshCw size={14} />
              Intentar nuevamente
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-1.5 font-sans text-sm text-muted hover:text-charcoal py-2.5 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-[var(--radius)]"
            >
              <ArrowLeft size={14} />
              Volver y cambiar procedimientos
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 flex flex-col pb-8 safe-bottom">
      <div className="w-full max-w-2xl mx-auto px-4">

        {/* ── Badge ── */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="inline-flex items-center gap-2 bg-gold-pale border border-gold/30 px-4 py-1.5 rounded-full">
            <span className="text-sm">✨</span>
            <span className="font-sans text-xs font-medium text-charcoal tracking-wide">
              Simulación con Inteligencia Artificial
            </span>
          </div>
        </div>

        {/* ── Headline ── */}
        <div className="text-center mb-6">
          <h1
            className="text-[28px] sm:text-[38px] text-charcoal leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            Los resultados hablan por sí solos
          </h1>
          <p className="font-sans text-sm text-muted mt-2 leading-relaxed max-w-md mx-auto">
            Los procedimientos que seleccionaste son seguros, rápidos y con resultados inmediatos.
            La Dra. Corral cuenta con más de 10 años de experiencia en armonización facial no invasiva.
          </p>
        </div>

        {/* ── Image section — blurred until disclaimer accepted ── */}
        <div
          ref={resultRef}
          style={{
            filter: disclaimerAccepted ? 'none' : 'blur(14px)',
            pointerEvents: disclaimerAccepted ? 'auto' : 'none',
            userSelect: disclaimerAccepted ? 'auto' : 'none',
            transition: 'filter 0.6s ease',
          }}
        >
          {/* Mobile slider */}
          <div className="block sm:hidden mb-5">
            <BeforeAfterSlider beforeUrl={originalPhotoUrl} afterUrl={generatedImageUrl} />
            <p className="font-sans text-xs text-muted text-center mt-2">
              Desliza para comparar
            </p>
          </div>

          {/* Desktop side-by-side */}
          <div className="hidden sm:grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <p className="font-sans text-xs text-muted text-center uppercase tracking-widest">
                Antes
              </p>
              <div className="rounded-[var(--radius)] overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
                <img
                  src={originalPhotoUrl}
                  alt="Foto original"
                  className="w-full object-cover aspect-[3/4]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-xs text-gold text-center uppercase tracking-widest font-medium">
                Después
              </p>
              <div className="rounded-[var(--radius)] overflow-hidden" style={{ boxShadow: 'var(--shadow-gold)' }}>
                <img
                  src={generatedImageUrl}
                  alt="Simulación del resultado"
                  className="w-full object-cover aspect-[3/4]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Disclaimer gate — floats after blurred image ── */}
        {!disclaimerAccepted && (
          <div
            style={{
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              opacity: disclaimerDismissing ? 0 : 1,
              transform: disclaimerDismissing ? 'translateY(12px)' : 'none',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-card)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-card)',
                maxWidth: '480px',
                margin: '12px auto 24px',
              }}
            >
              {/* Header */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--sage-dark)',
                  marginBottom: '10px',
                }}
              >
                ⚕️&nbsp; Resultado referencial
              </p>

              {/* Body */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: '8px',
                }}
              >
                Los resultados mostrados son referenciales. El cuidado
                post-aplicación del tratamiento es responsabilidad del paciente,
                y los resultados finales dependen de múltiples factores
                individuales.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: 'var(--text-dark)',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                Por eso resulta indispensable coordinar tu consulta de
                diagnóstico personalizada para obtener una evaluación
                profesional adaptada a ti.
              </p>

              {/* Checkbox row */}
              <div
                role="checkbox"
                aria-checked={disclaimerChecked}
                tabIndex={0}
                onClick={() => setDisclaimerChecked((v) => !v)}
                onKeyDown={(e) => e.key === ' ' && setDisclaimerChecked((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  outline: 'none',
                }}
              >
                {/* Custom checkbox box */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    minWidth: '20px',
                    marginTop: '1px',
                    border: '2px solid var(--sage-dark)',
                    borderRadius: '4px',
                    background: disclaimerChecked ? 'var(--sage-dark)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 200ms ease',
                  }}
                >
                  {disclaimerChecked && (
                    <Check size={12} color="white" strokeWidth={3} />
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-dark)',
                    lineHeight: 1.4,
                  }}
                >
                  Entiendo que los resultados son referenciales
                </span>
              </div>

              {/* Reveal button — animate in when checked */}
              {disclaimerChecked && (
                <div className="fade-up" style={{ marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    style={{ width: '100%' }}
                    onClick={handleAcceptDisclaimer}
                  >
                    Ver mi resultado →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Procedure info cards ── */}
        <div className="space-y-3 mb-6">
          {selectedProcsData.map(({ sel, proc }) => (
            <div
              key={proc.id}
              className="rounded-[var(--radius)] overflow-hidden border border-gold-light/50"
              style={{ boxShadow: 'var(--shadow-soft)' }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: `${proc.color}33` /* 20 % opacity */ }}
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                  style={{ backgroundColor: proc.color }}
                >
                  {proc.emoji}
                </div>
                <div>
                  <p
                    className="text-[17px] text-charcoal leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
                  >
                    {proc.name}
                  </p>
                  {(sel.zone || sel.intensity) && (
                    <p className="font-sans text-xs text-muted">
                      {[sel.zone, sel.intensity].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-3 divide-x divide-gold-light/40 px-0 py-0 bg-white/50">
                {[
                  { emoji: '🌿', label: 'Dolor', value: `${proc.pain}/10`, sub: proc.painLabel },
                  { emoji: '📅', label: 'Sesiones', value: String(proc.sessions), sub: proc.sessionsLabel },
                  { emoji: '⏱', label: 'Duración', value: proc.duration, sub: null },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center py-3 px-2 text-center">
                    <span className="text-base mb-0.5" aria-hidden="true">{item.emoji}</span>
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wide leading-none mb-1">
                      {item.label}
                    </p>
                    <p className="font-sans text-sm font-semibold text-charcoal leading-tight">
                      {item.value}
                    </p>
                    {item.sub && (
                      <p className="font-sans text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">
                        {item.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Aftercare tip */}
              <div className="bg-cream-dark/60 px-4 py-2.5 border-t border-gold-light/30">
                <p className="font-sans text-xs text-charcoal-light leading-relaxed">
                  <span className="font-medium text-charcoal">Cuidados: </span>
                  {proc.aftercare}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pricing CTA ── */}
        <div className="space-y-3 mt-2">
          {/* Dark sage pricing card */}
          <div
            style={{
              background: 'var(--sage-dark)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.75,
                marginBottom: '8px',
              }}
            >
              Sesión de Diagnóstico Personalizado
            </p>

            {/* Price display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '16px',
                  textDecoration: 'line-through',
                  opacity: 0.55,
                }}
              >
                $25.000
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '36px',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                $15.000
              </span>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                opacity: 0.7,
                marginBottom: '16px',
              }}
            >
              Con tu código de descuento exclusivo
            </p>

            {/* Included items */}
            {[
              '60 min con la Dra. Corral',
              'Evaluación facial completa',
              'Plan de tratamiento a medida',
            ].map((item) => (
              <p
                key={item}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  opacity: 0.9,
                  marginBottom: '4px',
                }}
              >
                ✓ {item}
              </p>
            ))}
          </div>

          {/* WhatsApp booking button */}
          <Button
            variant="white"
            size="lg"
            className="w-full"
            onClick={() => {
              const phone = import.meta.env.VITE_WA_PHONE || '56912345678';
              const msg = encodeURIComponent(
                '¡Hola Dra. Corral! Me gustaría agendar mi sesión de diagnóstico. Vi la simulación de mis tratamientos y quiero saber más. 😊',
              );
              window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
            }}
          >
            💬 Agendar por WhatsApp
          </Button>

          {/* Legal note */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '4px',
            }}
          >
            * Precio sujeto a confirmación en consulta. Válido por tiempo limitado.
          </p>

          {/* Share result */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm text-muted hover:text-charcoal border border-gold-light/60 hover:border-gold/50 rounded-[var(--radius)] py-3 min-h-[44px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-dark"
          >
            {shareCopied ? (
              <>
                <Check size={14} className="text-sage-dark" />
                <span className="text-sage-dark font-medium">Enlace copiado</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                Compartir resultado
              </>
            )}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm text-muted hover:text-charcoal py-2.5 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-dark rounded-[var(--radius)]"
          >
            <RefreshCw size={13} />
            Nueva simulación
          </button>
        </div>
      </div>
    </main>
  );
}
