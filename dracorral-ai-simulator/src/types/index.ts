export type { ZoneId, EffectId, IntensityLevel } from '../data/hyaluronic';

export interface HyaluronicSelection {
  zone: import('../data/hyaluronic').ZoneId;
  effect: import('../data/hyaluronic').EffectId;
  intensity: import('../data/hyaluronic').IntensityLevel;
}

export interface SimulatorState {
  step: 1 | 2 | 3 | 4;
  email: string | null;
  photoFile: File | null;
  photoPreviewUrl: string | null;
  selection: HyaluronicSelection | null;
  generatedImageUrl: string | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
}
