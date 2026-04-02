import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  labels: string[];
}

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  const totalSteps = labels.length;

  return (
    <nav
      aria-label="Pasos del simulador"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--sage-50)',
        padding: '10px 16px 8px',
      }}
    >

      {/* Mobile: current step label + progress bar */}
      <div
        className="sm:hidden"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--text-hint)',
            margin: 0,
          }}
        >
          Paso {currentStep} de {totalSteps}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--sage-700)',
            margin: 0,
          }}
        >
          {labels[currentStep - 1]}
        </p>
        {/* Progress bar */}
        <div
          style={{
            width: '120px',
            height: '3px',
            background: 'var(--sage-50)',
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(currentStep / totalSteps) * 100}%`,
              background: 'var(--sage-500)',
              borderRadius: '2px',
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </div>

      {/* Desktop: full step row */}
      <ol
        className="hidden sm:flex"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '480px',
          marginInline: 'auto',
        }}
      >
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = index === labels.length - 1;

          const circleStyle: React.CSSProperties = isCurrent
            ? {
                background: 'var(--sage-500)',
                color: '#FFFFFF',
                boxShadow: 'var(--shadow-sage)',
              }
            : isCompleted
            ? {
                background: 'var(--sage-100)',
                color: 'var(--sage-700)',
              }
            : {
                background: 'transparent',
                color: 'var(--text-hint)',
                border: '1.5px solid var(--sage-100)',
              };

          return (
            <li
              key={stepNumber}
              style={{ display: 'flex', alignItems: 'center', flex: 1 }}
            >
              {/* Circle + label */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 300ms ease',
                    ...circleStyle,
                  }}
                >
                  {isCompleted ? <Check size={13} strokeWidth={2.5} /> : stepNumber}
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    transition: 'color 300ms ease',
                    color: isCurrent
                      ? 'var(--sage-700)'
                      : isCompleted
                      ? 'var(--sage-300)'
                      : 'var(--text-hint)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: '1px',
                    margin: '0 4px 14px',
                    background: isCompleted ? 'var(--sage-300)' : 'var(--sage-50)',
                    transition: 'background 300ms ease',
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
