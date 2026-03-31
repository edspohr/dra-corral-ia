import { useReducer, useCallback } from 'react';
import type { SimulatorState, ProcedureId, ProcedureSelection } from '../types';
import { PROCEDURES } from '../data/procedures';
import { generateWithGemini } from '../services/gemini';
import { optimizeImage } from '../utils/imageOptimizer';
import { photoToBase64 } from '../utils/photoToBase64';

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: SimulatorState = {
  step: 1,
  email: null,
  photoFile: null,
  photoPreviewUrl: null,
  photoStoragePath: null,
  procedures: PROCEDURES.map((p) => ({
    id: p.id,
    enabled: false,
    zone: p.zones[0],
    intensity: p.intensities[0],
  })),
  generatedImageUrl: null,
  sessionId: null,
  leadCode: null,
  isLoading: false,
  error: null,
};

// ── Action types ───────────────────────────────────────────────────────────

type Action =
  | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 | 4 }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PHOTO'; payload: { file: File; previewUrl: string } }
  | { type: 'UPDATE_PROCEDURE'; payload: { id: ProcedureId; changes: Partial<ProcedureSelection> } }
  | { type: 'SET_GENERATED_IMAGE'; payload: { url: string; sessionId: string } }
  | { type: 'SET_PHOTO_STORAGE_PATH'; payload: string }
  | { type: 'SET_LEAD_CODE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// ── Reducer ────────────────────────────────────────────────────────────────

function simulatorReducer(state: SimulatorState, action: Action): SimulatorState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return { ...state, step: action.payload, error: null };

    case 'SET_EMAIL':
      // Capture email and automatically advance to photo step
      return { ...state, email: action.payload, step: 2, error: null };

    case 'SET_PHOTO':
      return {
        ...state,
        photoFile: action.payload.file,
        photoPreviewUrl: action.payload.previewUrl,
        error: null,
      };

    case 'UPDATE_PROCEDURE':
      return {
        ...state,
        procedures: state.procedures.map((p) =>
          p.id === action.payload.id
            ? { ...p, ...action.payload.changes }
            : p,
        ),
      };

    case 'SET_GENERATED_IMAGE':
      return {
        ...state,
        generatedImageUrl: action.payload.url,
        sessionId: action.payload.sessionId,
        isLoading: false,
        error: null,
      };

    case 'SET_PHOTO_STORAGE_PATH':
      return { ...state, photoStoragePath: action.payload };

    case 'SET_LEAD_CODE':
      return { ...state, leadCode: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSimulator() {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  // Step 1 → 2: email captured, reducer advances automatically
  const setEmail = useCallback((email: string) => {
    dispatch({ type: 'SET_EMAIL', payload: email });
  }, []);

  const goToStep = useCallback(
    (step: 1 | 2 | 3 | 4) => {
      // Step 3→4: at least one procedure must be selected
      if (step === 4) {
        const hasSelection = state.procedures.some((p) => p.enabled);
        if (!hasSelection) {
          dispatch({
            type: 'SET_ERROR',
            payload: 'Selecciona al menos un tratamiento antes de ver tu resultado.',
          });
          return;
        }
      }
      dispatch({ type: 'GO_TO_STEP', payload: step });
    },
    [state.procedures],
  );

  const setPhoto = useCallback((file: File, previewUrl: string) => {
    dispatch({ type: 'SET_PHOTO', payload: { file, previewUrl } });
  }, []);

  const updateProcedure = useCallback(
    (id: ProcedureId, changes: Partial<ProcedureSelection>) => {
      dispatch({ type: 'UPDATE_PROCEDURE', payload: { id, changes } });
    },
    [],
  );

  const setGeneratedImage = useCallback((url: string, sessionId: string) => {
    dispatch({ type: 'SET_GENERATED_IMAGE', payload: { url, sessionId } });
  }, []);

  const setPhotoStoragePath = useCallback((path: string) => {
    dispatch({ type: 'SET_PHOTO_STORAGE_PATH', payload: path });
  }, []);

  const setLeadCode = useCallback((code: string) => {
    dispatch({ type: 'SET_LEAD_CODE', payload: code });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((msg: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: msg });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const generateImage = useCallback(async () => {
    if (!state.photoFile) {
      dispatch({ type: 'SET_ERROR', payload: 'No hay foto seleccionada.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Resize to ≤1024px JPEG before sending to reduce payload and latency
      const optimized = await optimizeImage(state.photoFile);
      const { base64, mimeType } = await photoToBase64(optimized);

      // Map enabled procedures to the shape gemini.ts expects
      const enabledProcs = state.procedures
        .filter((p) => p.enabled)
        .map((p) => {
          const meta = PROCEDURES.find((pd) => pd.id === p.id)!;
          return {
            id: p.id,
            name: meta.name,
            zone: p.zone,
            intensity: p.intensity,
          };
        });

      const result = await generateWithGemini({
        photoBase64: base64,
        photoMimeType: mimeType,
        procedures: enabledProcs,
      });

      console.log('[Gemini] Image generated with model:', result.modelUsed);

      const sessionId = crypto.randomUUID();
      dispatch({
        type: 'SET_GENERATED_IMAGE',
        payload: { url: result.generatedImageUrl, sessionId },
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message === 'GEMINI_KEY_MISSING'
          ? 'Error de configuración: falta la API key de Gemini.'
          : 'No pudimos generar tu imagen. Por favor intenta nuevamente.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [state.photoFile, state.procedures]);

  // POC stub — Firebase removed. Phase B will wire real persistence if needed.
  const saveLead = useCallback(async (data: {
    nombre: string;
    email: string;
    telefono: string;
    onComplete: (code: string) => void;
  }) => {
    const code = 'DC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    dispatch({ type: 'SET_LEAD_CODE', payload: code });
    data.onComplete(code);
  }, []);

  const enabledProcedures = state.procedures.filter((p) => p.enabled);

  return {
    state,
    enabledProcedures,
    setEmail,
    goToStep,
    setPhoto,
    updateProcedure,
    setGeneratedImage,
    setPhotoStoragePath,
    setLeadCode,
    setLoading,
    setError,
    reset,
    generateImage,
    saveLead,
  };
}
