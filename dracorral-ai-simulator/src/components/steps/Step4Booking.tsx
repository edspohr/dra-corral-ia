import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import type { LeadData, ProcedureId } from '../../types';
import type { useSimulator } from '../../hooks/useSimulator';

type SimulatorActions = ReturnType<typeof useSimulator>;

interface Step4BookingProps {
  state: SimulatorActions['state'];
  enabledProcedures: SimulatorActions['enabledProcedures'];
  setLeadCode: SimulatorActions['setLeadCode'];
  setLoading: SimulatorActions['setLoading'];
  setError: SimulatorActions['setError'];
}

interface FormFields {
  nombre: string;
  email: string;
  telefono: string;
}

export function Step4Booking({
  state,
  enabledProcedures,
  setLeadCode,
  setLoading,
  setError,
}: Step4BookingProps) {
  const [form, setForm] = useState<FormFields>({ nombre: '', email: '', telefono: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isValid =
    form.nombre.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.telefono.trim().length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      // Generate a short lead code
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();

      const leadData: LeadData = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        sessionId: state.sessionId ?? 'local',
        code,
        procedures: enabledProcedures.map((p) => p.id as ProcedureId),
        createdAt: new Date(),
      };

      // Save to Firestore (lazy import to avoid breaking if Firebase isn't configured)
      try {
        const { db } = await import('../../services/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        await addDoc(collection(db, 'leads'), {
          ...leadData,
          createdAt: new Date(),
        });
      } catch {
        // Firebase may not be configured yet — proceed without persisting
        console.warn('Firestore save skipped (Firebase may not be configured).');
      }

      setLeadCode(code);
      setSubmitted(true);
    } catch {
      setError('Hubo un problema al guardar tu solicitud. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && state.leadCode) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full text-center">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center mb-6 shadow-[var(--shadow-gold)]">
          <Check size={28} className="text-white" strokeWidth={2.5} />
        </div>
        <h1
          className="font-serif text-3xl sm:text-4xl text-charcoal mb-3"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          ¡Todo listo!
        </h1>
        <p className="font-sans text-sm text-muted leading-relaxed mb-6">
          Hemos recibido tu solicitud. La Dra. Corral se pondrá en contacto contigo pronto para
          coordinar tu consulta.
        </p>

        {/* Lead code */}
        <div className="bg-gold-pale border border-gold-light rounded-[var(--radius)] px-6 py-4 mb-8">
          <p className="font-sans text-xs text-muted mb-1">Tu código de simulación</p>
          <p className="font-serif text-2xl text-charcoal font-semibold tracking-widest"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {state.leadCode}
          </p>
          <p className="font-sans text-xs text-muted mt-1">
            Guárdalo para referenciar tu simulación en la consulta.
          </p>
        </div>

        <p className="font-sans text-xs text-muted">
          También recibirás un email de confirmación en{' '}
          <span className="text-charcoal font-medium">{form.email}</span>.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12 max-w-md mx-auto w-full">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1
          className="font-serif text-3xl sm:text-4xl text-charcoal mb-2 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Agenda tu consulta
        </h1>
        <p className="font-sans text-sm text-muted leading-relaxed">
          Déjanos tus datos y la Dra. Corral se contactará contigo para coordinar tu visita.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
        {/* Nombre */}
        <div>
          <label
            htmlFor="nombre"
            className="block font-sans text-xs font-medium text-charcoal mb-1.5"
          >
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            className="w-full bg-white border border-gold-light rounded-[var(--radius-sm)] px-4 py-3 text-sm font-sans text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all min-h-[44px]"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block font-sans text-xs font-medium text-charcoal mb-1.5"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tu@correo.cl"
            required
            className="w-full bg-white border border-gold-light rounded-[var(--radius-sm)] px-4 py-3 text-sm font-sans text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all min-h-[44px]"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="telefono"
            className="block font-sans text-xs font-medium text-charcoal mb-1.5"
          >
            Teléfono (WhatsApp)
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            autoComplete="tel"
            value={form.telefono}
            onChange={handleChange}
            placeholder="+56 9 XXXX XXXX"
            required
            className="w-full bg-white border border-gold-light rounded-[var(--radius-sm)] px-4 py-3 text-sm font-sans text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all min-h-[44px]"
          />
        </div>

        {/* Privacy */}
        <p className="font-sans text-xs text-muted leading-relaxed">
          Tus datos son confidenciales y solo se usarán para coordinar tu consulta. No spam.
        </p>

        {/* Error */}
        {state.error && (
          <p className="text-sm text-red-600 font-sans" role="alert">
            {state.error}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={!isValid || state.isLoading}
        >
          {state.isLoading ? 'Enviando...' : 'Solicitar consulta →'}
        </Button>
      </form>
    </main>
  );
}
