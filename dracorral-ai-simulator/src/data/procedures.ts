import type { ProcedureId } from '../types';

export type { ProcedureId };

export interface Procedure {
  id: ProcedureId;
  name: string;
  subtitle: string;
  description: string;
  // Pain scale 1-10
  pain: number;
  painLabel: string;
  // Number of sessions
  sessions: number;
  sessionsLabel: string;
  // Effect duration
  duration: string;
  // Post-care instructions
  aftercare: string;
  // Selectable zones for this treatment
  zones: string[];
  // Selectable intensities/approaches
  intensities: string[];
  // Display emoji
  emoji: string;
  // Card accent color (light pastel for background)
  color: string;
  // AI prompt modifier — how to describe this treatment's visual effect
  aiPromptEffect: string;
}

export const PROCEDURES: Procedure[] = [
  {
    id: 'toxina',
    name: 'Toxina Botulínica',
    subtitle: 'Relajación muscular selectiva',
    description:
      'Relaja los músculos responsables de las arrugas de expresión, ' +
      'suavizando líneas de frente, entrecejo y patas de gallo con ' +
      'resultados naturales que preservan tu expresividad.',
    pain: 2,
    painLabel: 'Prácticamente indoloro — como un pinchazo leve',
    sessions: 1,
    sessionsLabel: '1 sesión · efecto visible en 3–7 días',
    duration: '4–6 meses',
    aftercare:
      'No acostarse las primeras 4 horas. Evitar ejercicio intenso y ' +
      'calor excesivo el día del procedimiento. No masajear la zona.',
    zones: ['Frente', 'Entrecejo', 'Patas de gallo', 'Arco de cejas (lifting)'],
    intensities: ['Natural (movimiento preservado)', 'Moderado', 'Máximo'],
    emoji: '✨',
    color: '#EDE8F5',
    aiPromptEffect:
      'Subtly relax forehead expression lines and crow\'s feet. ' +
      'Smooth the skin surface while preserving natural facial movement. ' +
      'The brow arch should appear slightly lifted and refreshed.',
  },
  {
    id: 'bioestimuladores',
    name: 'Bioestimuladores de Colágeno',
    subtitle: 'Regeneración profunda',
    description:
      'Estimulan la producción natural de colágeno desde adentro, ' +
      'mejorando la firmeza, elasticidad y calidad de la piel de forma ' +
      'progresiva. Resultados que mejoran con el tiempo.',
    pain: 3,
    painLabel: 'Molestia leve — se aplica anestesia tópica',
    sessions: 2,
    sessionsLabel: '2–3 sesiones · separadas por 4–6 semanas',
    duration: '12–24 meses',
    aftercare:
      'Evitar exposición solar directa por 48 horas. Hidratación extra ' +
      'durante la primera semana. Usar SPF 50 diariamente.',
    zones: ['Rostro completo', 'Cuello', 'Escote', 'Manos'],
    intensities: ['Mantenimiento', 'Revitalización', 'Tratamiento intensivo'],
    emoji: '🌿',
    color: '#E8F0E8',
    aiPromptEffect:
      'Improve overall skin firmness and elasticity. The skin should ' +
      'appear tighter and more lifted, with improved texture and a ' +
      'healthy, youthful glow. Reduce sagging along the jawline.',
  },
  {
    id: 'exosomas',
    name: 'Exosomas',
    subtitle: 'Regeneración celular avanzada',
    description:
      'Tecnología de vanguardia con vesículas extracelulares que ' +
      'activan los mecanismos naturales de regeneración celular. ' +
      'Mejora la textura, luminosidad y calidad global de la piel ' +
      'a nivel celular profundo.',
    pain: 1,
    painLabel: 'Indoloro — procedimiento no invasivo',
    sessions: 3,
    sessionsLabel: '3–4 sesiones · 1 por mes',
    duration: '6–9 meses',
    aftercare:
      'Protector solar SPF 50 obligatorio. Evitar calor intenso (sauna, ' +
      'steam room) por 48 horas. Mantener hidratación extra.',
    zones: ['Rostro', 'Cuello y escote', 'Contorno de ojos', 'Cuero cabelludo'],
    intensities: ['Protocolo básico', 'Protocolo rejuvenecedor', 'Protocolo intensivo'],
    emoji: '💫',
    color: '#E8EDF5',
    aiPromptEffect:
      'Transform skin texture to appear extraordinarily smooth and ' +
      'luminous. The complexion should glow with deep hydration and ' +
      'cellular vitality. Fine lines minimized, pores refined, skin ' +
      'appears porcelain-like with natural radiance.',
  },
  {
    id: 'polinucleotidos',
    name: 'Polinucleótidos',
    subtitle: 'Hidratación y reparación celular',
    description:
      'Fragmentos de ADN purificado que hidratan profundamente, ' +
      'reparan el tejido dañado y estimulan la regeneración natural. ' +
      'Ideal para piel opaca, deshidratada o con daño solar acumulado.',
    pain: 2,
    painLabel: 'Muy tolerable — similar a skin boosters',
    sessions: 4,
    sessionsLabel: '4 sesiones · 1 cada 2 semanas',
    duration: '6–12 meses',
    aftercare:
      'Evitar maquillaje las primeras 12 horas. No exposición solar ' +
      'directa 48 horas. Hidratación abundante durante el tratamiento.',
    zones: ['Rostro completo', 'Contorno de ojos', 'Cuello', 'Escote y manos'],
    intensities: ['Hidratación profunda', 'Reparación activa', 'Rejuvenecimiento total'],
    emoji: '🔬',
    color: '#F5EDE8',
    aiPromptEffect:
      'Deep hydration effect: skin appears plump, dewy, and intensely ' +
      'moisturized. Reduce dark circles and hollowness around the eyes. ' +
      'Even out skin tone and minimize sun damage spots. ' +
      'Overall appearance: refreshed and well-rested.',
  },
];
