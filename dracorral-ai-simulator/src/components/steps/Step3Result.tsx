import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import { RefreshCw, Check, ArrowLeft } from 'lucide-react';
import type { HyaluronicSelection } from '../../types';
import { ZONES, EFFECTS, INTENSITIES, TREATMENT_INFO } from '../../data/hyaluronic';
import { exportSideBySideImage } from '../../utils/shareImage';

// ── Props ──────────────────────────────────────────────────────────────────

interface Step3ResultProps {
  originalPhotoUrl: string;
  generatedImageUrl: string | null;
  selection: HyaluronicSelection;
  isLoading: boolean;
  error: string | null;
  email: string;
  onRetry: () => void;
  onBack: () => void;
}

// ── Loading messages ───────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analizando tu rostro...',
  'Aplicando los tratamientos seleccionados...',
  'Ajustando iluminación y detalles...',
  'Añadiendo los toques finales...',
  'Tu resultado está casi listo...',
] as const;

// ── LoadingScreen ──────────────────────────────────────────────────────────

const LoadingScreen = memo(function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgKey, setMsgKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
      setMsgKey((k) => k + 1);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--cream)',
        padding: '0 24px',
      }}
    >
      {/* Monogram circle with ripple rings */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '1.5px solid var(--sage-100)',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: '32px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="gold-ripple-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid var(--sage-100)',
            }}
          />
        ))}
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--sage-700)',
            letterSpacing: '0.1em',
            position: 'relative',
            zIndex: 1,
          }}
        >
          D|C
        </span>
      </div>

      {/* Rotating message */}
      <div
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: '6px',
        }}
      >
        <p
          key={msgKey}
          className="msg-in"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {LOADING_MESSAGES[msgIdx]}
        </p>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          margin: '0 0 28px',
        }}
      >
        Esto toma aproximadamente 20–30 segundos
      </p>

      {/* Progress bar — animates 0→85% over 25s */}
      <div
        role="progressbar"
        aria-label="Generando imagen"
        style={{
          width: '100%',
          maxWidth: '280px',
          height: '3px',
          backgroundColor: 'var(--sage-50)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--sage-500)',
            height: '100%',
            borderRadius: 'inherit',
            width: '0%',
            animation: 'aiProgress 25s cubic-bezier(0.1, 0.4, 0.3, 1) forwards',
          }}
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

const BeforeAfterSlider = memo(function BeforeAfterSlider({ beforeUrl, afterUrl }: SliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start at 35% — shows mostly AFTER for maximum first impact
  const [pos, setPos] = useState(35);
  const isDragging = useRef(false);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setHintVisible(false), 3000);
    return () => clearTimeout(id);
  }, []);

  const clamp = (v: number) => Math.max(2, Math.min(98, v));

  const posFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return 35;
    const rect = el.getBoundingClientRect();
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPos(posFromClientX(e.clientX));
  }, [posFromClientX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPos(posFromClientX(e.clientX));
  }, [posFromClientX]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[var(--radius-card)] select-none touch-none cursor-ew-resize"
        style={{ aspectRatio: '3/4', boxShadow: 'var(--shadow-soft)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Before (full size, behind) */}
        <img
          src={beforeUrl}
          alt="Tu foto original"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* After (clipped to show left `pos`%) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={afterUrl}
            alt="Tu resultado simulado"
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
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M5 1L1 7L5 13" stroke="#5A7248" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 1L17 7L13 13" stroke="#5A7248" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ANTES label */}
        <div className="absolute pointer-events-none" style={{ bottom: '12px', left: '12px' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(4px)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '100px',
            }}
          >
            ANTES
          </span>
        </div>

        {/* DESPUÉS label */}
        <div className="absolute pointer-events-none" style={{ bottom: '12px', right: '12px' }}>
          <span
            style={{
              background: 'var(--sage-700)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '100px',
            }}
          >
            DESPUÉS ✨
          </span>
        </div>
      </div>

      {/* Swipe hint — fades out after 3s */}
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'var(--sage-300)',
          textAlign: 'center',
          fontStyle: 'italic',
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          margin: '8px 0 0',
        }}
      >
        ← Desliza para comparar →
      </p>
    </>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export function Step3Result({
  originalPhotoUrl,
  generatedImageUrl,
  selection,
  isLoading,
  error,
  email,
  onRetry,
  onBack,
}: Step3ResultProps) {
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [disclaimerDismissing, setDisclaimerDismissing] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [shareDownloaded, setShareDownloaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Resolve display data from selection
  const zone = ZONES.find((z) => z.id === selection.zone)!;
  const effect = EFFECTS.find((e) => e.id === selection.effect)!;
  const intensity = INTENSITIES.find((i) => i.id === selection.intensity)!;

  const handleAcceptDisclaimer = useCallback(() => {
    setDisclaimerDismissing(true);
    setTimeout(() => {
      setDisclaimerAccepted(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }, 400);
  }, []);

  const handleInstagramShare = useCallback(async () => {
    if (!generatedImageUrl || isSharing) return;
    setIsSharing(true);
    try {
      await exportSideBySideImage(originalPhotoUrl, generatedImageUrl);
      setShareDownloaded(true);
      setTimeout(() => setShareDownloaded(false), 4000);
    } catch {
      // Fail silently — download may have been blocked by browser
    } finally {
      setIsSharing(false);
    }
  }, [originalPhotoUrl, generatedImageUrl, isSharing]);

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
              Volver
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

        {/* Badge */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="inline-flex items-center gap-2 bg-gold-pale border border-gold/30 px-4 py-1.5 rounded-full">
            <span className="text-sm">✨</span>
            <span className="font-sans text-xs font-medium text-charcoal tracking-wide">
              Simulación con Inteligencia Artificial
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h1
            className="text-[28px] sm:text-[38px] leading-tight"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--sage-dark)' }}
          >
            Tu resultado está listo
          </h1>
        </div>

        {/* ── Image section — blurred until disclaimer accepted ── */}
        <div ref={resultRef}>
          <div
            style={{
              filter: disclaimerAccepted ? 'none' : 'blur(18px)',
              transition: 'filter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              pointerEvents: disclaimerAccepted ? 'auto' : 'none',
              userSelect: disclaimerAccepted ? 'auto' : 'none',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
            }}
            aria-hidden={!disclaimerAccepted}
          >
            {/* Mobile: drag-to-reveal slider */}
            <div className="block sm:hidden mb-2">
              <BeforeAfterSlider beforeUrl={originalPhotoUrl} afterUrl={generatedImageUrl} />
            </div>

            {/* Desktop: side-by-side grid */}
            <div className="hidden sm:block mb-5">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={originalPhotoUrl}
                    alt="Tu foto original"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute', bottom: '12px', left: '12px',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      color: 'white', fontFamily: 'var(--font-sans)',
                      fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: '100px',
                    }}
                  >
                    ANTES
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <img
                    src={generatedImageUrl}
                    alt="Tu resultado simulado"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute', bottom: '12px', right: '12px',
                      background: 'var(--sage-dark)', backdropFilter: 'blur(4px)',
                      color: 'white', fontFamily: 'var(--font-sans)',
                      fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: '100px',
                    }}
                  >
                    DESPUÉS ✨
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Disclaimer gate ── */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>⚕️</span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '18px',
                    color: 'var(--sage-dark)',
                    fontWeight: 600,
                  }}
                >
                  Resultado referencial
                </span>
              </div>

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
                  marginBottom: '12px',
                  fontWeight: 500,
                }}
              >
                Por eso resulta indispensable coordinar tu consulta de
                diagnóstico personalizada para obtener una evaluación
                profesional adaptada a ti.
              </p>

              {/* Email reminder */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Tu resultado quedará asociado a{' '}
                <strong style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{email}</strong>
              </p>

              {/* Checkbox */}
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
                  {disclaimerChecked && <Check size={12} color="white" strokeWidth={3} />}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-dark)',
                    lineHeight: 1.5,
                  }}
                >
                  Entiendo que los resultados son referenciales y que necesito
                  una consulta de diagnóstico para un resultado personalizado
                </span>
              </div>

              {/* Reveal button — appears with fadeUp when checkbox checked */}
              {disclaimerChecked && (
                <button
                  type="button"
                  onClick={handleAcceptDisclaimer}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '52px',
                    marginTop: '16px',
                    background: 'var(--sage-dark)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '16px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    animation: 'fadeUp 0.3s ease forwards',
                  }}
                >
                  Ver mi resultado →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Post-reveal content ── */}
        {disclaimerAccepted && (
          <div className="mt-6 space-y-4">

            {/* Treatment info card */}
            <div
              className="rounded-[var(--radius)] px-4 py-4"
              style={{ background: 'var(--sage-50)', border: '1px solid var(--sage-100)' }}
            >
              {/* Zone + treatment name */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-2xl leading-none" aria-hidden="true">{zone.emoji}</span>
                <div>
                  <p
                    className="text-[17px] text-charcoal leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
                  >
                    {zone.name}
                  </p>
                  <p className="font-sans text-xs text-muted leading-snug">
                    {effect.name} · {intensity.name}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { icon: '💉', label: 'Dolor', value: `${TREATMENT_INFO.painLevel}/10`, sub: 'leve' },
                  { icon: '📅', label: 'Sesiones', value: String(TREATMENT_INFO.sessions), sub: TREATMENT_INFO.sessionsLabel },
                  { icon: '⏱', label: 'Duración', value: TREATMENT_INFO.duration, sub: 'del efecto' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center rounded-[var(--radius-sm)] py-2.5 px-1.5"
                    style={{ background: 'rgba(255,255,255,0.75)' }}
                  >
                    <div className="text-base mb-0.5" aria-hidden="true">{stat.icon}</div>
                    <div
                      className="text-[15px] font-semibold leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--sage-dark)' }}
                    >
                      {stat.value}
                    </div>
                    <div className="font-sans text-[10px] text-muted leading-snug mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Aftercare */}
              <div
                className="flex gap-2 items-start rounded-[var(--radius-sm)] px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.65)' }}
              >
                <span aria-hidden="true">💡</span>
                <p className="font-sans text-xs text-charcoal leading-relaxed">
                  <strong className="font-medium">Cuidados: </strong>
                  {TREATMENT_INFO.aftercare}
                </p>
              </div>
            </div>

            {/* Instagram share button */}
            <div>
              <button
                type="button"
                onClick={handleInstagramShare}
                disabled={isSharing}
                className={`w-full flex items-center justify-center gap-2 font-sans font-medium text-base rounded-full py-4 min-h-[52px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${!isSharing ? 'cta-pulse' : ''}`}
                style={{
                  background: 'var(--gold)',
                  color: '#1E2D16',
                  opacity: isSharing ? 0.7 : 1,
                }}
              >
                📸 {isSharing ? 'Preparando imagen...' : 'Compartir en Instagram'}
              </button>

              {/* Download toast */}
              {shareDownloaded && (
                <p
                  className="font-sans text-xs text-center mt-2 fade-up"
                  style={{ color: 'var(--sage-700)' }}
                >
                  ✓ Imagen descargada — compártela en Instagram
                </p>
              )}
            </div>

            {/* Nueva simulación ghost button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 font-sans text-sm text-muted hover:text-charcoal py-2.5 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-dark rounded-[var(--radius)]"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Nueva simulación
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
