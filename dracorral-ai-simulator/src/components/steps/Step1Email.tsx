import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '../ui/Button';

interface Step1EmailProps {
  onComplete: (email: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = ['✓ Gratis', '✓ Privado', '✓ Instantáneo'] as const;

export function Step1Email({ onComplete }: Step1EmailProps) {
  const [email, setEmailValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setHasError(true);
      triggerShake();
      inputRef.current?.focus();
      return;
    }

    setHasError(false);
    localStorage.setItem('dc_lead_email', trimmed);
    console.log('[Lead captured]', trimmed);
    onComplete(trimmed);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);
    if (hasError) setHasError(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--sage-500)';
    e.target.style.boxShadow = '0 0 0 3px rgba(90,114,72,0.12)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = hasError ? '#DC2626' : 'var(--sage-100)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--cream)',
      }}
    >
      {/* Hero section */}
      <div
        style={{
          background: 'linear-gradient(180deg, var(--sage-50) 0%, #FFFFFF 100%)',
          flex: '0 0 42vh',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px 56px',
        }}
      >
        {/* D|C logo */}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '44px',
            fontWeight: 700,
            color: 'var(--sage-700)',
            letterSpacing: '0.14em',
            lineHeight: 1,
            marginBottom: '12px',
          }}
        >
          D|C
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '21px',
            fontStyle: 'italic',
            color: 'var(--sage-500)',
            textAlign: 'center',
            maxWidth: '260px',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Tu mejor versión, a un paso
        </p>
      </div>

      {/* Form card — overlaps hero by 24px */}
      <div
        className="slide-up email-card"
        style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          marginTop: '-24px',
          padding: '32px 24px 48px',
          maxWidth: '480px',
          width: '100%',
          alignSelf: 'center',
          boxSizing: 'border-box',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
          overflowY: 'auto',
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '26px',
            fontWeight: 600,
            color: '#1E2D16',
            lineHeight: 1.2,
            margin: '0 0 10px',
          }}
        >
          Descubre cómo quedarías
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: '0 0 18px',
          }}
        >
          Sube tu foto y visualiza el resultado de botox, rellenos y más — con
          inteligencia artificial. Es gratis.
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          {FEATURES.map((feature) => (
            <span
              key={feature}
              style={{
                background: 'var(--sage-50)',
                color: 'var(--sage-700)',
                border: '1px solid var(--sage-100)',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 500,
                padding: '4px 14px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="dc-email"
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-dark)',
                marginBottom: '8px',
              }}
            >
              Tu correo electrónico
            </label>

            <input
              ref={inputRef}
              id="dc-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="nombre@email.com"
              className={isShaking ? 'shake' : ''}
              style={{
                display: 'block',
                width: '100%',
                height: '52px',
                padding: '0 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                color: 'var(--text-dark)',
                background: '#FFFFFF',
                border: `1.5px solid ${hasError ? '#DC2626' : 'var(--sage-100)'}`,
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
              }}
            />

            {hasError && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: '#DC2626',
                  marginTop: '6px',
                  marginBottom: 0,
                }}
                role="alert"
              >
                Ingresa un correo válido
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" style={{ width: '100%' }}>
            Comenzar mi simulación →
          </Button>
        </form>

        {/* Privacy note */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--text-hint)',
            textAlign: 'center',
            marginTop: '10px',
            marginBottom: 0,
          }}
        >
          🔒 Solo usamos tu correo para enviarte tu resultado. Sin spam.
        </p>
      </div>
    </main>
  );
}
