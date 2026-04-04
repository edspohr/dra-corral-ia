import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ZONES, EFFECTS, INTENSITIES, TREATMENT_INFO } from '../../data/hyaluronic';
import type { ZoneId, EffectId, IntensityLevel } from '../../data/hyaluronic';
import type { HyaluronicSelection } from '../../types';

// ── Props ──────────────────────────────────────────────────────────────────

interface Step3EffectProps {
  selection: HyaluronicSelection | null;
  photoPreviewUrl: string | null;
  onUpdateSelection: (selection: HyaluronicSelection) => void;
  onComplete: () => void;
  onBack: () => void;
}

// ── ZoneCard ───────────────────────────────────────────────────────────────

interface ZoneCardProps {
  zone: (typeof ZONES)[number];
  isSelected: boolean;
  onSelect: (id: ZoneId) => void;
}

const ZoneCard = memo(function ZoneCard({ zone, isSelected, onSelect }: ZoneCardProps) {
  const handleClick = useCallback(() => onSelect(zone.id), [zone.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSelected}
      className={clsx(
        'relative w-full text-left rounded-[var(--radius)] p-3',
        'transition-all duration-150 min-h-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
      )}
      style={isSelected ? {
        background: 'var(--sage-50)',
        border: '2px solid var(--sage-500)',
        boxShadow: 'var(--shadow-sage)',
      } : {
        background: '#FFFFFF',
        border: '1px solid var(--sage-100)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Check icon top-right when selected */}
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--sage-500)' }}
        >
          <Check size={11} className="text-white" strokeWidth={3} />
        </span>
      )}

      <span className="text-2xl leading-none block mb-1.5" aria-hidden="true">
        {zone.emoji}
      </span>
      <p
        className="text-[15px] text-charcoal font-medium leading-tight mb-0.5"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {zone.name}
      </p>
      <p className="font-sans text-[11px] text-muted leading-snug">
        {zone.description}
      </p>
    </button>
  );
});

// ── IntensityCard ──────────────────────────────────────────────────────────

interface IntensityCardProps {
  option: (typeof INTENSITIES)[number];
  isSelected: boolean;
  onSelect: (id: IntensityLevel) => void;
}

const IntensityCard = memo(function IntensityCard({
  option,
  isSelected,
  onSelect,
}: IntensityCardProps) {
  const handleClick = useCallback(() => onSelect(option.id), [option.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSelected}
      className={clsx(
        'flex-1 text-left rounded-[var(--radius-sm)] px-3 py-3',
        'transition-all duration-150 min-h-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
      )}
      style={isSelected ? {
        background: 'var(--sage-50)',
        border: '2px solid var(--sage-500)',
      } : {
        background: '#FFFFFF',
        border: '1px solid var(--sage-100)',
      }}
    >
      <p
        className="text-sm font-medium text-charcoal leading-tight mb-0.5"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {option.name}
      </p>
      <p className="font-sans text-[11px] text-muted leading-snug">
        {option.description}
      </p>
    </button>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export function Step3Effect({
  selection,
  photoPreviewUrl,
  onUpdateSelection,
  onComplete,
  onBack,
}: Step3EffectProps) {
  // Initialize from prop when user navigates back to this step
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(
    () => selection?.zone ?? null,
  );
  const [selectedEffect, setSelectedEffect] = useState<EffectId | null>(
    () => selection?.effect ?? null,
  );
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>(
    () => selection?.intensity ?? 'natural',
  );

  // Notify parent whenever a complete selection exists
  useEffect(() => {
    if (selectedZone && selectedEffect) {
      onUpdateSelection({ zone: selectedZone, effect: selectedEffect, intensity: selectedIntensity });
    }
  }, [selectedZone, selectedEffect, selectedIntensity, onUpdateSelection]);

  const handleZoneSelect = useCallback((zoneId: ZoneId) => {
    setSelectedZone(zoneId);
    // Clear effect if it's not available in the newly selected zone
    const zone = ZONES.find((z) => z.id === zoneId)!;
    setSelectedEffect((prev) =>
      prev && zone.availableEffects.includes(prev) ? prev : null,
    );
  }, []);

  const handleEffectSelect = useCallback((effectId: EffectId) => {
    setSelectedEffect(effectId);
  }, []);

  const handleIntensitySelect = useCallback((level: IntensityLevel) => {
    setSelectedIntensity(level);
  }, []);

  const canContinue = selectedZone !== null && selectedEffect !== null;

  const handleComplete = useCallback(() => {
    if (canContinue) onComplete();
  }, [canContinue, onComplete]);

  // Derived data
  const currentZone = selectedZone ? ZONES.find((z) => z.id === selectedZone) : null;
  const availableEffects = currentZone
    ? EFFECTS.filter((e) => currentZone.availableEffects.includes(e.id))
    : [];

  return (
    <>
      {/* ── Scrollable main area ─────────────────────────────────────────── */}
      <main
        className={clsx(
          'flex-1 flex flex-col px-4 py-6 sm:py-8 max-w-2xl mx-auto w-full',
          canContinue ? 'pb-[140px] sm:pb-8' : 'pb-8',
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
              <img src={photoPreviewUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* ── Heading ── */}
        <div className="mb-6">
          <h1
            className="text-[28px] sm:text-[38px] text-charcoal leading-tight mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
          >
            ¿Qué resultado buscas?
          </h1>
          <p className="font-sans text-sm text-muted leading-relaxed">
            Ácido hialurónico — selecciona zona, efecto e intensidad
          </p>
        </div>

        {/* ── Section 1: Zone selection ── */}
        <section className="mb-6">
          <p
            className="font-sans text-[12px] font-medium tracking-widest uppercase mb-3"
            style={{ color: 'var(--sage-700)' }}
          >
            Zona a tratar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ZONES.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                isSelected={selectedZone === zone.id}
                onSelect={handleZoneSelect}
              />
            ))}
          </div>
        </section>

        {/* ── Section 2: Effect selection (visible once zone is chosen) ── */}
        {selectedZone && (
          <section className="mb-6 fade-up">
            <p
              className="font-sans text-[12px] font-medium tracking-widest uppercase mb-3"
              style={{ color: 'var(--sage-700)' }}
            >
              Efecto deseado
            </p>
            <div
              role="group"
              aria-label="Efecto deseado"
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {availableEffects.map((effect) => {
                const isSelected = selectedEffect === effect.id;
                return (
                  <button
                    key={effect.id}
                    type="button"
                    onClick={() => handleEffectSelect(effect.id)}
                    aria-pressed={isSelected}
                    className={clsx(
                      'flex-shrink-0 flex flex-col px-4 py-2.5 rounded-full border',
                      'transition-all duration-150 whitespace-nowrap min-h-[44px]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                      !isSelected && 'bg-white/60 border-[var(--sage-100)] text-muted hover:border-[var(--sage-500)] hover:text-[var(--sage-700)]',
                    )}
                    style={isSelected ? {
                      scrollSnapAlign: 'start',
                      background: 'var(--sage-500)',
                      borderColor: 'var(--sage-500)',
                      color: '#FFFFFF',
                      fontWeight: 500,
                      boxShadow: 'var(--shadow-sage)',
                    } : { scrollSnapAlign: 'start' }}
                  >
                    <span className="font-sans text-xs font-medium leading-tight">
                      {effect.name}
                    </span>
                    <span
                      className={clsx(
                        'font-sans text-[10px] leading-snug mt-0.5',
                        isSelected ? 'text-white/80' : 'text-muted',
                      )}
                    >
                      {effect.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 3: Intensity selection (visible once effect is chosen) ── */}
        {selectedEffect && (
          <section className="mb-6 fade-up">
            <p
              className="font-sans text-[12px] font-medium tracking-widest uppercase mb-3"
              style={{ color: 'var(--sage-700)' }}
            >
              Intensidad
            </p>
            <div className="flex gap-2.5" role="group" aria-label="Intensidad del tratamiento">
              {INTENSITIES.map((option) => (
                <IntensityCard
                  key={option.id}
                  option={option}
                  isSelected={selectedIntensity === option.id}
                  onSelect={handleIntensitySelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Treatment info card (always visible) ── */}
        <div
          className="rounded-[var(--radius)] px-4 py-4 mt-2 mb-2"
          style={{ background: 'var(--sage-50)', border: '1px solid var(--sage-100)' }}
        >
          <p
            className="text-[15px] text-charcoal font-medium mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {TREATMENT_INFO.name}
            <span className="font-sans text-xs text-muted font-normal ml-2">
              {TREATMENT_INFO.subtitle}
            </span>
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {[
              `💉 ${TREATMENT_INFO.painLabel}`,
              `📅 ${TREATMENT_INFO.sessionsLabel}`,
              `⏱ ${TREATMENT_INFO.duration}`,
            ].map((label) => (
              <span
                key={label}
                className="font-sans text-[11px] text-charcoal-light bg-white/70 border border-gold-light/80 px-2.5 py-1 rounded-full leading-none"
              >
                {label}
              </span>
            ))}
          </div>

          <p className="font-sans text-[11px] text-muted leading-relaxed">
            <span className="font-medium text-charcoal-light">Post procedimiento: </span>
            {TREATMENT_INFO.aftercare}
          </p>
        </div>

        {/* ── Desktop CTA ── */}
        <div className="hidden sm:block mt-6">
          <button
            type="button"
            onClick={handleComplete}
            disabled={!canContinue}
            className={clsx(
              'w-full flex items-center justify-center gap-2.5',
              'font-sans font-medium text-base rounded-[var(--radius)] py-4 min-h-[56px]',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              canContinue
                ? 'active:scale-[0.99]'
                : 'cursor-default',
            )}
            style={canContinue ? {
              background: 'var(--sage-500)',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-sage)',
            } : {
              background: 'var(--sage-100)',
              color: 'var(--muted)',
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            {canContinue ? 'Generar mi simulación →' : 'Selecciona zona y efecto'}
          </button>
        </div>
      </main>

      {/* ── Mobile sticky bottom bar ─────────────────────────────────────── */}
      {canContinue && currentZone && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 slide-up"
          style={{
            background: 'rgba(250,248,244,0.96)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: '1px solid var(--sage-100)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
        >
          {/* Selection summary */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-xl leading-none" aria-hidden="true">
              {currentZone.emoji}
            </span>
            <p className="font-sans text-sm text-charcoal-light leading-tight">
              <span className="font-semibold text-charcoal">Zona: </span>
              {currentZone.name}
            </p>
          </div>

          {/* Full-width CTA */}
          <button
            type="button"
            onClick={handleComplete}
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'font-sans font-medium text-base',
              'rounded-[var(--radius)] py-3.5 min-h-[52px]',
              'active:scale-[0.98] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            )}
            style={{
              background: 'var(--sage-500)',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-sage)',
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            Generar mi simulación →
          </button>
        </div>
      )}
    </>
  );
}
