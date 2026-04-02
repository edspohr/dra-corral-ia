import { useState, useCallback, memo } from 'react';
import { ArrowLeft, Loader2, Copy, Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { submitLead } from '../../services/firestore';

// ── Props ──────────────────────────────────────────────────────────────────

interface Step4LeadProps {
  email: string;        // pre-filled from Step 1
  sessionId: string;
  procedures: string[]; // enabled procedure IDs
  onComplete: (code: string) => void;
  onBack: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const WA_PHONE = (import.meta.env.VITE_WA_PHONE as string | undefined) ?? '';

function buildWaUrl(code: string): string {
  const text = `Hola Dra. Corral! Me gustaría agendar mi sesión de diagnóstico personalizado. Mi código de descuento es ${code}`;
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

// ── Form field component ───────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  error?: string;
  placeholder?: string;
  prefix?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  onChange: (v: string) => void;
  onBlur: () => void;
}

const Field = memo(function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  error,
  placeholder,
  prefix,
  inputMode,
  onChange,
  onBlur,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-xs font-medium text-charcoal mb-1.5">
        {label}
      </label>
      <div
        className={clsx(
          'flex rounded-[var(--radius-sm)] border transition-colors',
          error
            ? 'border-red-400'
            : 'border-[var(--sage-100)] focus-within:border-[var(--sage-500)]',
        )}
      >
        {prefix && (
          <span
            className="flex-shrink-0 flex items-center px-3 rounded-l-[var(--radius-sm)] select-none"
            style={{
              background: 'var(--sage-50)',
              borderRight: '1px solid var(--sage-100)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          className={clsx(
            'flex-1 bg-white px-4 py-3.5 placeholder:text-muted/50',
            'focus:outline-none',
            prefix ? 'rounded-r-[var(--radius-sm)]' : 'rounded-[var(--radius-sm)]',
          )}
          style={{
            minHeight: '52px',
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--text-primary)',
          }}
        />
      </div>
      {error && (
        <p className="mt-1 font-sans text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

// ── Accordion item ─────────────────────────────────────────────────────────

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionItem = memo(function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: AccordionItemProps) {
  return (
    <div
      className="border-b last:border-none"
      style={{ borderColor: 'var(--sage-100)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-inset"
      >
        <span
          className="font-sans text-sm"
          style={{ fontWeight: 500, color: 'var(--sage-700)' }}
        >{title}</span>
        <ChevronDown
          size={15}
          className={clsx('flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="pb-4 font-sans text-sm text-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export function Step4Lead({
  email: initialEmail,
  sessionId,
  procedures,
  onComplete,
  onBack,
}: Step4LeadProps) {
  // ── Form state ─────────────────────────────────────────────────────────
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [telefono, setTelefono] = useState('');
  const [touched, setTouched] = useState({ nombre: false, email: false, telefono: false });

  // ── Submission state ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  // ── Success state ──────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // ── Validation ─────────────────────────────────────────────────────────
  const errors = {
    nombre: nombre.trim().length < 3 ? 'El nombre debe tener al menos 3 caracteres' : undefined,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Ingresa un email válido' : undefined,
    telefono: !/^\d{8,9}$/.test(telefono.replace(/\s/g, ''))
      ? 'Ingresa 8 o 9 dígitos (sin +56)'
      : undefined,
  };
  const isValid = !errors.nombre && !errors.email && !errors.telefono;

  const touch = useCallback((field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, telefono: true });
    if (!isValid) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      const result = await submitLead({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.replace(/\s/g, ''),
        sessionId,
        procedures,
      });
      setCode(result.code);
      onComplete(result.code);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No pudimos guardar tus datos. Por favor intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Copy code ──────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  const toggleFaq = useCallback((key: string) => {
    setOpenFaq((prev) => (prev === key ? null : key));
  }, []);

  // ── SUCCESS VIEW ───────────────────────────────────────────────────────
  if (code) {
    const waUrl = buildWaUrl(code);

    return (
      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-md mx-auto w-full">
        <div className="scale-in w-full space-y-5">

          {/* Celebration header */}
          <div className="text-center">
            <p className="text-3xl mb-3">🎉</p>
            <h1
              className="text-[28px] sm:text-[34px] text-charcoal leading-tight mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
            >
              ¡Tu código está listo!
            </h1>
            <p className="font-sans text-sm text-muted">
              Úsalo al agendar tu sesión y obtén tu precio especial.
            </p>
          </div>

          {/* Code box */}
          <button
            type="button"
            onClick={() => handleCopy(code)}
            aria-label={`Copiar código ${code}`}
            className="code-shimmer w-full px-6 py-6 text-center transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--gold-pale)',
              border: '1.5px solid var(--gold)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            <p
              className="leading-none"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--sage-700)',
                letterSpacing: '0.14em',
              }}
            >
              {code}
            </p>
            <p
              className="mt-2"
              style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
            >
              {copied ? '✓ ¡Copiado!' : 'Toca para copiar'}
            </p>
          </button>

          {/* Price reminder */}
          <div className="text-center space-y-0.5">
            <p className="font-sans text-base font-semibold text-charcoal">
              Sesión de diagnóstico:{' '}
              <span className="text-gold">$15.000 CLP</span>
            </p>
            <p className="font-sans text-xs text-muted">
              <s>Precio normal: $25.000</s> · Válido por 30 días
            </p>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={WA_PHONE ? waUrl : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center justify-center gap-3',
              'w-full rounded-[var(--radius)] py-4 min-h-[56px]',
              'font-sans font-medium text-base text-white',
              'transition-all duration-150 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              !WA_PHONE && 'opacity-50 pointer-events-none',
            )}
            style={{
              backgroundColor: '#25D366',
              boxShadow: '0 4px 16px rgba(37,211,102,0.22)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            💬 Agendar por WhatsApp
          </a>

          {/* Copy ghost button */}
          <button
            type="button"
            onClick={() => handleCopy(code)}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm text-muted hover:text-charcoal border border-gold-light/60 hover:border-gold/50 rounded-[var(--radius)] py-3 min-h-[44px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {copied ? (
              <><Check size={14} className="text-gold" /><span className="text-gold font-medium">¡Copiado!</span></>
            ) : (
              <><Copy size={14} />📋 Copiar código</>
            )}
          </button>

          {/* FAQ accordion */}
          <div
            className="rounded-[var(--radius)] px-4"
            style={{
              background: 'var(--sage-50)',
              border: '1px solid var(--sage-100)',
            }}
          >
            <AccordionItem
              title="¿Qué incluye tu diagnóstico?"
              isOpen={openFaq === 'includes'}
              onToggle={() => toggleFaq('includes')}
            >
              <ul className="space-y-2">
                {[
                  '✅ 60 minutos con la Dra. Corral',
                  '✅ Evaluación facial completa con fotografía clínica',
                  '✅ Plan de tratamiento a medida con presupuesto',
                  '✅ Sin compromiso de compra',
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AccordionItem>

            <AccordionItem
              title="¿Cómo uso mi código?"
              isOpen={openFaq === 'howto'}
              onToggle={() => toggleFaq('howto')}
            >
              <ol className="space-y-2 list-decimal list-inside">
                <li>Contáctanos por WhatsApp usando el botón de arriba.</li>
                <li>Indica tu nombre y menciona el código <strong>{code}</strong>.</li>
                <li>Coordina fecha y hora de tu sesión.</li>
                <li>Presenta el código al llegar a la clínica.</li>
              </ol>
            </AccordionItem>

            <AccordionItem
              title="¿Dónde está la clínica?"
              isOpen={openFaq === 'location'}
              onToggle={() => toggleFaq('location')}
            >
              <p>
                Nos ubicamos en Santiago, Chile. Al agendar por WhatsApp te enviaremos la dirección
                exacta y las instrucciones de acceso.
              </p>
            </AccordionItem>
          </div>
        </div>
      </main>
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col px-4 py-6 sm:py-8 max-w-md mx-auto w-full">

      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-charcoal transition-colors min-h-[44px] -ml-1 px-1 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
      >
        <ArrowLeft size={15} />
        Volver a mi resultado
      </button>

      {/* Headline */}
      <div className="mb-5">
        <h1
          className="text-[26px] sm:text-[34px] text-charcoal leading-tight mb-1.5"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
        >
          Tu diagnóstico personalizado
        </h1>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Completa tus datos y recibe tu código de descuento exclusivo.
        </p>
      </div>

      {/* Price card */}
      <div
        className="rounded-[var(--radius)] p-4 mb-6 space-y-3"
        style={{
          background: 'var(--sage-50)',
          border: '1px solid var(--sage-100)',
        }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'var(--sage-700)' }}
        >
          Sesión de Diagnóstico Personalizado
        </p>
        <div className="flex items-baseline gap-3">
          <span
            className="line-through"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-hint)' }}
          >
            $25.000
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--gold)',
              lineHeight: 1,
            }}
          >
            $15.000 CLP
          </span>
        </div>
        <p className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>Con tu código exclusivo</p>
        <ul className="space-y-1.5">
          {[
            '60 minutos con la Dra. Corral',
            'Evaluación facial completa',
            'Plan de tratamiento a medida',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 font-sans text-xs">
              <span style={{ color: '#2D7D46' }} className="mt-0.5 flex-shrink-0">✅</span>
              <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          id="nombre"
          label="Nombre completo"
          autoComplete="name"
          value={nombre}
          error={touched.nombre ? errors.nombre : undefined}
          placeholder="Tu nombre"
          onChange={setNombre}
          onBlur={() => touch('nombre')}
        />

        <Field
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          error={touched.email ? errors.email : undefined}
          placeholder="tu@correo.cl"
          inputMode="email"
          onChange={setEmail}
          onBlur={() => touch('email')}
        />

        <Field
          id="telefono"
          label="Teléfono (WhatsApp)"
          type="tel"
          autoComplete="tel"
          value={telefono}
          error={touched.telefono ? errors.telefono : undefined}
          placeholder="9 1234 5678"
          prefix="+56"
          inputMode="tel"
          onChange={setTelefono}
          onBlur={() => touch('telefono')}
        />

        {/* Privacy note */}
        <p className="font-sans text-xs text-muted leading-relaxed">
          🔒 Solo usamos tus datos para contactarte sobre tu diagnóstico. No spam.
        </p>

        {/* Server error */}
        {submitError && (
          <div
            role="alert"
            className="font-sans text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-4 py-3"
          >
            {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            'w-full flex items-center justify-center gap-2.5',
            'font-sans font-medium text-base rounded-[var(--radius)] py-4 min-h-[56px]',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            !isLoading && 'active:scale-[0.99]',
          )}
          style={isLoading ? {
            background: 'var(--sage-100)',
            color: 'var(--text-muted)',
            cursor: 'wait',
          } : {
            background: 'var(--sage-500)',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-sage)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            'Obtener mi código →'
          )}
        </button>
      </form>
    </main>
  );
}
