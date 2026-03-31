import { memo, useRef, useCallback, useState } from 'react';
import { Check, ArrowLeft, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { PROCEDURES, type ProcedureData } from '../../data/procedures';
import type { ProcedureId, ProcedureSelection } from '../../types';

// ── Props ──────────────────────────────────────────────────────────────────

interface Step2ProceduresProps {
  procedures: ProcedureSelection[];
  photoPreviewUrl: string | null;
  onUpdateProcedure: (id: ProcedureId, changes: Partial<ProcedureSelection>) => void;
  onComplete: () => void;
  onBack: () => void;
}

// ── ChipSelector ───────────────────────────────────────────────────────────
// Reusable horizontal scrolling chip row with snap behaviour

interface ChipSelectorProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

const ChipSelector = memo(function ChipSelector({
  label,
  options,
  selected,
  onChange,
}: ChipSelectorProps) {
  return (
    <div>
      <p className="font-sans text-xs font-medium text-charcoal mb-2">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={isSelected}
              style={{ scrollSnapAlign: 'start' }}
              className={clsx(
                'flex-shrink-0 px-4 py-2 text-xs font-sans rounded-full border',
                'transition-all duration-150 whitespace-nowrap min-h-[38px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
                isSelected
                  ? 'bg-gold border-gold text-charcoal font-medium shadow-[var(--shadow-gold)]'
                  : 'bg-white/60 border-gold-light text-muted hover:border-gold hover:text-charcoal-light',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ── ProcedureCard ──────────────────────────────────────────────────────────
// Memoised so only the toggled card re-renders when state changes

interface ProcedureCardProps {
  proc: ProcedureData;
  sel: ProcedureSelection;
  onUpdateProcedure: (id: ProcedureId, changes: Partial<ProcedureSelection>) => void;
}

const ProcedureCard = memo(function ProcedureCard({
  proc,
  sel,
  onUpdateProcedure,
}: ProcedureCardProps) {
  const isEnabled = sel.enabled;

  // Stable handlers — only recreated when proc.id / sel.enabled / onUpdateProcedure change
  const handleToggle = useCallback(
    () => onUpdateProcedure(proc.id, { enabled: !sel.enabled }),
    [proc.id, sel.enabled, onUpdateProcedure],
  );
  const handleZoneChange = useCallback(
    (zone: string) => onUpdateProcedure(proc.id, { zone }),
    [proc.id, onUpdateProcedure],
  );
  const handleIntensityChange = useCallback(
    (intensity: string) => onUpdateProcedure(proc.id, { intensity }),
    [proc.id, onUpdateProcedure],
  );

  return (
    <div
      className={clsx(
        'rounded-[var(--radius)] border transition-all duration-200',
        // Subtle lift on hover (desktop)
        'hover:-translate-y-px will-change-transform',
        isEnabled
          ? 'bg-gold-pale border-gold shadow-[var(--shadow-gold)]'
          : 'bg-cream-dark/50 border-gold-light/70 shadow-[var(--shadow-soft)]',
      )}
    >
      {/* ── Toggle row ── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isEnabled}
        aria-expanded={isEnabled}
        aria-controls={`proc-expand-${proc.id}`}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-4 text-left',
          'min-h-[72px] cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset',
          // Top radius always; bottom radius only when collapsed
          isEnabled ? 'rounded-t-[var(--radius)]' : 'rounded-[var(--radius)]',
        )}
      >
        {/* Custom checkbox */}
        <div
          aria-hidden="true"
          className={clsx(
            'w-6 h-6 rounded-md border-2 flex-shrink-0',
            'flex items-center justify-center',
            'transition-all duration-200',
            isEnabled ? 'bg-gold border-gold' : 'bg-white/80 border-gold-light',
          )}
        >
          {isEnabled && <Check size={13} className="text-white" strokeWidth={3} />}
        </div>

        {/* Emoji avatar */}
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
          style={{ backgroundColor: proc.color }}
        >
          {proc.emoji}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[17px] text-charcoal leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            {proc.name}
          </p>
          <p className="font-sans text-xs text-muted mt-0.5 leading-snug">{proc.subtitle}</p>
        </div>
      </button>

      {/* ── Expandable detail panel ── */}
      <div
        id={`proc-expand-${proc.id}`}
        aria-hidden={!isEnabled}
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isEnabled ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-4 pb-5 space-y-4 border-t border-gold/20">
          {/* Brief description */}
          <p className="font-sans text-sm text-charcoal-light leading-relaxed pt-3">
            {proc.description}
          </p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {[
              `⏱ ${proc.duration}`,
              `💉 ${proc.sessionsLabel}`,
              proc.painLabel,
            ].map((label) => (
              <span
                key={label}
                className="font-sans text-[11px] text-charcoal-light bg-white/70 border border-gold-light/80 px-2.5 py-1 rounded-full leading-none"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Zone chip selector */}
          <ChipSelector
            label="Zona a tratar"
            options={proc.zones}
            selected={sel.zone ?? proc.zones[0]}
            onChange={handleZoneChange}
          />

          {/* Intensity chip selector */}
          <ChipSelector
            label="Intensidad del tratamiento"
            options={proc.intensities}
            selected={sel.intensity ?? proc.intensities[0]}
            onChange={handleIntensityChange}
          />

          {/* Post-procedure tip */}
          <div className="bg-white/50 rounded-[var(--radius-sm)] px-3 py-2.5">
            <p className="font-sans text-xs text-charcoal-light leading-relaxed">
              <span className="font-medium text-charcoal">Post procedimiento: </span>
              {proc.aftercare}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export function Step2Procedures({
  procedures,
  photoPreviewUrl,
  onUpdateProcedure,
  onComplete,
  onBack,
}: Step2ProceduresProps) {
  const [validationError, setValidationError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const cardsGridRef = useRef<HTMLDivElement>(null);

  const selectedProcedures = procedures.filter((p) => p.enabled);
  const selectedCount = selectedProcedures.length;
  const hasSelection = selectedCount > 0;

  const handleContinue = useCallback(() => {
    if (!hasSelection) {
      setValidationError(true);
      // Trigger shake, then remove class so it can re-trigger
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      // Scroll to cards on mobile
      cardsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setValidationError(false);
    onComplete();
  }, [hasSelection, onComplete]);

  // Hide validation error as soon as user selects something
  const handleUpdateWithClear = useCallback(
    (id: ProcedureId, changes: Partial<ProcedureSelection>) => {
      onUpdateProcedure(id, changes);
      if (changes.enabled) setValidationError(false);
    },
    [onUpdateProcedure],
  );

  return (
    <>
      {/* ── Scrollable main area ─────────────────────────────────────────── */}
      <main
        className={clsx(
          'flex-1 flex flex-col px-4 py-6 sm:py-8 max-w-2xl mx-auto w-full',
          // Extra bottom padding on mobile so sticky bar doesn't overlap content
          hasSelection ? 'pb-[128px] sm:pb-8' : 'pb-8',
        )}
      >
        {/* ── Top row: back + photo thumbnail ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-charcoal transition-colors min-h-[44px] -ml-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
          >
            <ArrowLeft size={15} />
            Volver
          </button>

          {photoPreviewUrl && (
            <div
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold flex-shrink-0"
              style={{ boxShadow: 'var(--shadow-gold)' }}
              aria-hidden="true"
            >
              <img
                src={photoPreviewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* ── Heading ── */}
        <div className="mb-6">
          <h1
            className="text-[28px] sm:text-[38px] text-charcoal leading-tight mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            ¿Qué te gustaría mejorar?
          </h1>
          <p className="font-sans text-sm text-muted leading-relaxed">
            Selecciona uno o más tratamientos y personaliza el resultado.
          </p>
        </div>

        {/* ── Validation error banner ── */}
        {validationError && !hasSelection && (
          <div
            role="alert"
            aria-live="polite"
            className="fade-up mb-4 font-sans text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-[var(--radius-sm)] px-4 py-3"
          >
            Selecciona al menos un tratamiento para ver tu resultado.
          </div>
        )}

        {/* ── Cards grid ── */}
        <div
          ref={cardsGridRef}
          className={clsx(
            'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
            shaking && 'shake',
          )}
        >
          {PROCEDURES.map((proc) => {
            const sel = procedures.find((p) => p.id === proc.id)!;
            return (
              <ProcedureCard
                key={proc.id}
                proc={proc}
                sel={sel}
                onUpdateProcedure={handleUpdateWithClear}
              />
            );
          })}
        </div>

        {/* ── Desktop continue button ── */}
        <div className="hidden sm:block mt-8">
          <button
            type="button"
            onClick={handleContinue}
            className={clsx(
              'w-full flex items-center justify-center gap-2.5',
              'font-sans font-medium text-base rounded-[var(--radius)] py-4 min-h-[56px]',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              hasSelection
                ? 'bg-gold text-charcoal hover:bg-gold-light shadow-[var(--shadow-gold)] active:scale-[0.99]'
                : 'bg-gold-light/60 text-muted cursor-default',
            )}
          >
            <Sparkles size={16} />
            {hasSelection
              ? `Ver mi resultado — ${selectedCount} tratamiento${selectedCount > 1 ? 's' : ''}`
              : 'Selecciona al menos un tratamiento'}
          </button>
        </div>
      </main>

      {/* ── Mobile sticky bottom bar ───────────────────────────────────────── */}
      {/* Conditionally rendered — triggers slide-up on first appearance */}
      {hasSelection && (
        <div
          className={clsx(
            'sm:hidden fixed bottom-0 left-0 right-0 z-40',
            'bg-cream/95 backdrop-blur-md',
            'border-t border-gold-light',
            'px-4 pt-3',
            'slide-up',
          )}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          {/* Selection summary */}
          <div className="flex items-center gap-2.5 mb-3">
            {/* Emoji stack */}
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {selectedProcedures.map((sel) => {
                const proc = PROCEDURES.find((p) => p.id === sel.id)!;
                return (
                  <span
                    key={sel.id}
                    className="text-[15px] leading-none"
                  >
                    {proc.emoji}
                  </span>
                );
              })}
            </div>
            <p className="font-sans text-sm text-charcoal-light leading-tight">
              <span className="font-semibold text-charcoal">{selectedCount}</span>
              {' '}tratamiento{selectedCount > 1 ? 's' : ''} seleccionado{selectedCount > 1 ? 's' : ''}
            </p>
          </div>

          {/* Full-width CTA */}
          <button
            type="button"
            onClick={handleContinue}
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'bg-gold text-charcoal font-sans font-medium text-base',
              'rounded-[var(--radius)] py-3.5 min-h-[52px]',
              'hover:bg-gold-light active:scale-[0.98]',
              'transition-all duration-150',
              'shadow-[var(--shadow-gold)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
            )}
          >
            <Sparkles size={16} aria-hidden="true" />
            Ver mi resultado →
          </button>
        </div>
      )}
    </>
  );
}
