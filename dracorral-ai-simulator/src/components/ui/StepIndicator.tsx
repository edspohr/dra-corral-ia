import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  labels: string[];
}

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  const totalSteps = labels.length;

  return (
    <nav aria-label="Pasos del simulador" style={{ padding: '12px 16px 8px' }}>

      {/* Mobile: current step label + progress bar */}
      <div
        className="sm:hidden"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          Paso {currentStep} de {totalSteps}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--sage-dark)',
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
            background: 'var(--sage-pale)',
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(currentStep / totalSteps) * 100}%`,
              background: 'var(--sage-dark)',
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 300ms ease',
                    ...(isCompleted || isCurrent
                      ? {
                          background: 'var(--sage-dark)',
                          color: '#FFFFFF',
                          boxShadow: isCurrent ? 'var(--shadow-sage)' : 'none',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          border: '1.5px solid var(--sage-pale)',
                        }),
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
                      ? 'var(--sage-dark)'
                      : isCompleted
                      ? 'var(--sage-mid)'
                      : 'var(--text-muted)',
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
                    margin: '0 6px 16px',
                    background: isCompleted ? 'var(--sage-dark)' : 'var(--sage-pale)',
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
