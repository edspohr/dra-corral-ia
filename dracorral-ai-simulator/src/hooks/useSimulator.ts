import { useReducer, useCallback } from 'react';
import type { SimulatorState, HyaluronicSelection } from '../types';
import { generateBeautySimulation, GeminiApiError } from '../services/gemini';
import { optimizeImage } from '../utils/imageOptimizer';
import { photoToBase64 } from '../utils/photoToBase64';

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: SimulatorState = {
  step: 1,
  email: null,
  photoFile: null,
  photoPreviewUrl: null,
  selection: null,
  generatedImageUrl: null,
  sessionId: null,
  isLoading: false,
  error: null,
};

// ── Action types ───────────────────────────────────────────────────────────

type Action =
  | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 | 4 }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PHOTO'; payload: { file: File; previewUrl: string } }
  | { type: 'SET_SELECTION'; payload: HyaluronicSelection }
  | { type: 'SET_GENERATED_IMAGE'; payload: { url: string; sessionId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// ── Reducer ────────────────────────────────────────────────────────────────

function simulatorReducer(state: SimulatorState, action: Action): SimulatorState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.payload,
        error: null,
        // Going backwards from step 4 clears the generated result
        generatedImageUrl:
          state.step === 4 && action.payload < 4 ? null : state.generatedImageUrl,
      };

    case 'SET_EMAIL':
      return { ...state, email: action.payload, step: 2, error: null };

    case 'SET_PHOTO':
      return {
        ...state,
        photoFile: action.payload.file,
        photoPreviewUrl: action.payload.previewUrl,
        error: null,
      };

    case 'SET_SELECTION':
      return { ...state, selection: action.payload, error: null };

    case 'SET_GENERATED_IMAGE':
      return {
        ...state,
        generatedImageUrl: action.payload.url,
        sessionId: action.payload.sessionId,
        isLoading: false,
        error: null,
      };

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

  const setEmail = useCallback((email: string) => {
    dispatch({ type: 'SET_EMAIL', payload: email });
  }, []);

  const goToStep = useCallback(
    (step: 1 | 2 | 3 | 4) => {
      if (step === 4 && state.selection === null) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Selecciona una zona y efecto antes de ver tu simulación.',
        });
        return;
      }
      dispatch({ type: 'GO_TO_STEP', payload: step });
    },
    [state.selection],
  );

  const setPhoto = useCallback((file: File, previewUrl: string) => {
    dispatch({ type: 'SET_PHOTO', payload: { file, previewUrl } });
  }, []);

  const setSelection = useCallback((selection: HyaluronicSelection) => {
    dispatch({ type: 'SET_SELECTION', payload: selection });
  }, []);

  const setGeneratedImage = useCallback((url: string, sessionId: string) => {
    dispatch({ type: 'SET_GENERATED_IMAGE', payload: { url, sessionId } });
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
    if (!state.selection) {
      dispatch({ type: 'SET_ERROR', payload: 'Selecciona una zona y efecto primero.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const optimized = await optimizeImage(state.photoFile);
      const { base64, mimeType } = await photoToBase64(optimized);

      const result = await generateBeautySimulation({ photoBase64: base64, photoMimeType: mimeType, selection: state.selection! });

      const sessionId = crypto.randomUUID();
      dispatch({
        type: 'SET_GENERATED_IMAGE',
        payload: { url: result.imageDataUrl, sessionId },
      });
    } catch (err) {
      const msg =
        err instanceof GeminiApiError
          ? err.userMessage
          : 'No pudimos generar tu imagen. Por favor intenta nuevamente en 30 segundos.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [state.photoFile, state.selection]);

  return {
    state,
    setEmail,
    goToStep,
    setPhoto,
    setSelection,
    setGeneratedImage,
    setLoading,
    setError,
    reset,
    generateImage,
  };
}
