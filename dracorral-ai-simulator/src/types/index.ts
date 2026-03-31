export type ProcedureId = 'botox' | 'hyaluronic' | 'skinbooster' | 'biorevit';
export type ZoneOption = string;

export interface ProcedureSelection {
  id: ProcedureId;
  enabled: boolean;
  zone?: ZoneOption;
  intensity?: string;
}

export interface SimulatorState {
  step: 1 | 2 | 3 | 4;
  email: string | null;
  photoFile: File | null;
  photoPreviewUrl: string | null;
  photoStoragePath: string | null;
  procedures: ProcedureSelection[];
  generatedImageUrl: string | null;
  sessionId: string | null;
  leadCode: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LeadData {
  nombre: string;
  email: string;
  telefono: string;
  sessionId: string;
  code: string;
  procedures: ProcedureId[];
  createdAt: Date;
}
