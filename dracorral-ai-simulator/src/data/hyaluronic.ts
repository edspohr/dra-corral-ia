export type ZoneId =
  | 'labios'
  | 'surcos_nasogenianos'
  | 'ojeras'
  | 'pomulos'
  | 'menton'
  | 'marioneta';

export type EffectId =
  | 'volumen'
  | 'relleno'
  | 'proyeccion'
  | 'correccion'
  | 'definicion'
  | 'hidratacion';

export type IntensityLevel = 'sutil' | 'natural' | 'marcado';

export interface Zone {
  id: ZoneId;
  name: string;
  description: string;
  emoji: string;
  availableEffects: EffectId[];
  aiPromptEffect: Record<IntensityLevel, string>;
}

export interface Effect {
  id: EffectId;
  name: string;
  description: string;
}

export const ZONES: Zone[] = [
  {
    id: 'labios',
    name: 'Labios',
    description: 'Aumenta el volumen y define el contorno labial para una apariencia más jugosa y equilibrada.',
    emoji: '💋',
    availableEffects: ['volumen', 'definicion', 'hidratacion'],
    aiPromptEffect: {
      sutil:
        'Subtly enhance lip volume with natural-looking fullness. Add very slight definition to the cupid\'s bow while maintaining the original lip shape and proportions. The result should look like naturally full lips, not augmented.',
      natural:
        'Moderately increase lip volume with visible but harmonious fullness. Gently define the cupid\'s bow and soften vertical lip lines. The enhancement should be noticeable yet balanced with the rest of the face.',
      marcado:
        'Significantly increase lip volume with pronounced fullness. Enhanced cupid\'s bow definition, more projected lip borders, and visibly plumper appearance. Maintain facial harmony but the lip enhancement should be clearly noticeable.',
    },
  },
  {
    id: 'surcos_nasogenianos',
    name: 'Surcos nasogenianos',
    description: 'Suaviza los pliegues que van de la nariz a las comisuras de los labios, devolviendo frescura al tercio medio.',
    emoji: '✨',
    availableEffects: ['relleno', 'correccion'],
    aiPromptEffect: {
      sutil:
        'Very gently soften the nasolabial folds — the lines running from the nose to the corners of the mouth — so they are barely visible. The skin should look slightly smoother and more rested, with no loss of natural facial expression.',
      natural:
        'Visibly reduce the depth of the nasolabial folds, creating a smoother transition between the cheek and the upper lip area. The result should look refreshed and natural, as if the person has rested well.',
      marcado:
        'Significantly fill and smooth the nasolabial folds, making them nearly flat. The middle-third of the face should look notably rejuvenated, with a clear reduction of shadowing in the fold area.',
    },
  },
  {
    id: 'ojeras',
    name: 'Ojeras',
    description: 'Rellena el surco infraorbitario para reducir la sombra oscura y la apariencia de cansancio.',
    emoji: '👁️',
    availableEffects: ['correccion', 'hidratacion'],
    aiPromptEffect: {
      sutil:
        'Very slightly reduce the hollow tear-trough area under the eyes. Minimize dark shadows caused by the depression, making the under-eye area look marginally more rested. Preserve all natural contours.',
      natural:
        'Moderately fill the tear-trough depression under the eyes to reduce dark circles and the tired appearance. The transition between the lower eyelid and the cheek should look smoother and better supported.',
      marcado:
        'Substantially correct the under-eye hollow, significantly reducing the shadow and sunken appearance. The under-eye area should look well-rested and youthful, with a smooth cheek-to-eyelid contour and minimal dark-circle shadowing.',
    },
  },
  {
    id: 'pomulos',
    name: 'Pómulos',
    description: 'Añade volumen y proyección a los pómulos para una estructura facial más definida y juvenil.',
    emoji: '🌟',
    availableEffects: ['volumen', 'proyeccion'],
    aiPromptEffect: {
      sutil:
        'Very subtly lift and add minimal volume to the cheekbones, creating a barely-there enhancement that makes the midface look slightly more structured. The change should be imperceptible unless compared side-by-side.',
      natural:
        'Visibly enhance the cheekbones with balanced volume, creating a natural lift to the midface. The cheeks should look fuller and more defined, with a gentle highlight effect that adds youthful structure without appearing overdone.',
      marcado:
        'Significantly augment and project the cheekbones, creating a strong, sculpted midface appearance. The cheeks should have clear definition and projection, lifting the lower face and creating a noticeably more structured facial contour.',
    },
  },
  {
    id: 'menton',
    name: 'Mentón',
    description: 'Proyecta y define el mentón para mejorar el perfil y el equilibrio facial.',
    emoji: '💎',
    availableEffects: ['definicion', 'proyeccion'],
    aiPromptEffect: {
      sutil:
        'Very slightly project and refine the chin, adding minimal definition. The chin should appear marginally more prominent and better balanced with the rest of the face when viewed from the front and in profile.',
      natural:
        'Moderately enhance chin projection and definition, creating a more balanced and harmonious facial profile. The improvement should be visible in both frontal and lateral views, contributing to a more defined jawline.',
      marcado:
        'Significantly project and sculpt the chin, creating a strong and well-defined lower face. The chin should be clearly more prominent, improving the facial profile and contributing to a sharper, more structured jawline appearance.',
    },
  },
  {
    id: 'marioneta',
    name: 'Arrugas marioneta',
    description: 'Rellena los pliegues que bajan desde las comisuras labiales, corrigiendo el aspecto de tristeza o envejecimiento.',
    emoji: '🪄',
    availableEffects: ['relleno', 'correccion'],
    aiPromptEffect: {
      sutil:
        'Very gently soften the marionette lines — the folds descending from the corners of the mouth toward the chin — so they are barely visible. The mouth corners should appear very slightly lifted and less downturned.',
      natural:
        'Visibly reduce the marionette lines, filling the downward folds from the mouth corners. The lower face should look more rested and less sad, with the mouth corners appearing naturally lifted.',
      marcado:
        'Significantly fill and correct the marionette lines, making them nearly imperceptible. The lower face should look substantially rejuvenated, with the mouth corners clearly lifted and the overall expression appearing more positive and youthful.',
    },
  },
];

export const EFFECTS: Effect[] = [
  {
    id: 'volumen',
    name: 'Volumen',
    description: 'Aumenta el relleno y la plenitud de la zona tratada.',
  },
  {
    id: 'relleno',
    name: 'Relleno',
    description: 'Corrige pliegues y surcos restaurando el contorno natural.',
  },
  {
    id: 'proyeccion',
    name: 'Proyección',
    description: 'Añade dimensión y prominencia hacia adelante en la estructura facial.',
  },
  {
    id: 'correccion',
    name: 'Corrección',
    description: 'Suaviza marcas visibles como ojeras, pliegues o asimetrías.',
  },
  {
    id: 'definicion',
    name: 'Definición',
    description: 'Realza el contorno y la nitidez de la zona tratada.',
  },
  {
    id: 'hidratacion',
    name: 'Hidratación',
    description: 'Mejora la luminosidad y tersura de la piel desde adentro.',
  },
];

export const INTENSITIES: { id: IntensityLevel; name: string; description: string }[] = [
  {
    id: 'sutil',
    name: 'Sutil',
    description: 'Cambio apenas perceptible, muy natural',
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Mejora visible pero armónica con tu rostro',
  },
  {
    id: 'marcado',
    name: 'Marcado',
    description: 'Resultado notorio y definido',
  },
];

export const TREATMENT_INFO = {
  name: 'Ácido Hialurónico',
  subtitle: 'Relleno dérmico facial',
  painLevel: 2,
  painLabel: 'Molestia leve — se aplica anestesia tópica',
  sessions: 1,
  sessionsLabel: '1 sesión · resultados inmediatos',
  duration: '8–14 meses',
  aftercare:
    'Evitar ejercicio intenso 24 horas. No masajear la zona tratada. Aplicar frío si hay inflamación leve. Protector solar diario.',
} as const;
