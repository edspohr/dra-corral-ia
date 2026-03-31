import type { ProcedureId } from '../types';

export interface ProcedureData {
  id: ProcedureId;
  name: string;
  subtitle: string;
  description: string;
  pain: number;
  painLabel: string;
  sessions: number;
  sessionsLabel: string;
  duration: string;
  aftercare: string;
  zones: string[];
  intensities: string[];
  emoji: string;
  color: string;
}

export const PROCEDURES: ProcedureData[] = [
  {
    id: 'botox',
    name: 'Toxina Botulínica',
    subtitle: 'Botox',
    description:
      'Relaja los músculos que causan arrugas de expresión, suavizando frente, entrecejo y patas de gallo de forma natural.',
    pain: 1,
    painLabel: 'Prácticamente indoloro',
    sessions: 1,
    sessionsLabel: '1 sesión (efecto en 3-7 días)',
    duration: '4-6 meses',
    aftercare:
      'No acostarse las primeras 4 horas. Evitar ejercicio intenso el día del procedimiento.',
    zones: ['Frente', 'Entrecejo', 'Patas de gallo', 'Arco de cejas'],
    intensities: ['Natural', 'Moderado', 'Máximo'],
    emoji: '✨',
    color: '#E8D5D0',
  },
  {
    id: 'hyaluronic',
    name: 'Ácido Hialurónico',
    subtitle: 'Relleno facial',
    description:
      'Restaura volumen y contorno facial. Ideal para labios, pómulos y ojeras. Resultado inmediato y natural.',
    pain: 2,
    painLabel: 'Mínimas molestias',
    sessions: 1,
    sessionsLabel: '1 sesión (resultado inmediato)',
    duration: '9-18 meses',
    aftercare:
      'Evitar masajes en la zona por 24h. Aplicar frío suave si hay inflamación.',
    zones: ['Labios', 'Pómulos', 'Ojeras', 'Surcos nasogenianos'],
    intensities: ['Sutil', 'Medio', 'Pronunciado'],
    emoji: '💫',
    color: '#D5E0E8',
  },
  {
    id: 'skinbooster',
    name: 'Skin Boosters',
    subtitle: 'Hidratación profunda',
    description:
      'Microinyecciones de ácido hialurónico no reticulado que hidratan desde adentro, mejorando textura y luminosidad.',
    pain: 2,
    painLabel: 'Muy tolerable',
    sessions: 3,
    sessionsLabel: '3 sesiones (1 por mes)',
    duration: '6-9 meses',
    aftercare: 'Evitar sol directo 48h. Hidratación extra los primeros días.',
    zones: ['Rostro completo', 'Cuello', 'Escote', 'Contorno de ojos'],
    intensities: ['Hidratación', 'Glow intenso', 'Firmeza'],
    emoji: '🌿',
    color: '#D5E8D5',
  },
  {
    id: 'biorevit',
    name: 'Biorrevitalización',
    subtitle: 'Regeneración celular',
    description:
      'Cocktail de vitaminas, aminoácidos y minerales que revitaliza la piel desde adentro, mejorando tonicidad y calidad general.',
    pain: 2,
    painLabel: 'Prácticamente indoloro',
    sessions: 4,
    sessionsLabel: '4 sesiones (1 cada 2 semanas)',
    duration: '4-6 meses',
    aftercare:
      'Usar protector solar diario SPF 50. Evitar calor excesivo 24h.',
    zones: ['Rostro', 'Cuello y escote', 'Manos', 'Cuerpo'],
    intensities: ['Mantenimiento', 'Revitalización', 'Tratamiento intensivo'],
    emoji: '🌸',
    color: '#E8D5E8',
  },
];
