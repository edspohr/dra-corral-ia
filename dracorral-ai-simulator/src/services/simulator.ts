import type { ProcedureSelection } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';
import { deleteUserPhoto } from './storage';

const FUNCTIONS_BASE_URL =
  (import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined) ??
  'http://127.0.0.1:5001/dracorral-simulator/southamerica-east1';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the "data:<mime>;base64," prefix
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function httpErrorMessage(status: number): string {
  if (status === 400) {
    return 'Hubo un problema con tu foto. Por favor intenta con otra imagen.';
  }
  return 'El servicio de generación está momentáneamente ocupado. Intenta en 30 segundos.';
}

export async function callGenerateImage(params: {
  file: File;
  sessionId: string;
  procedures: ProcedureSelection[];
}): Promise<{ generatedImageUrl: string }> {
  const { file, sessionId, procedures } = params;

  // Resize to ≤1024 px JPEG before sending — reduces payload and Gemini processing time
  const optimized = await optimizeImage(file);
  const photoBase64 = await fileToBase64(optimized);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoBase64,
        photoMimeType: 'image/jpeg',
        procedures: procedures.map((p) => ({
          id: p.id,
          zone: p.zone,
          intensity: p.intensity,
        })),
        sessionId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(httpErrorMessage(response.status));
    }

    const data = (await response.json()) as { generatedImageUrl: string };

    // Privacy: remove original from Storage in the background; don't block the result
    deleteUserPhoto(sessionId).catch(() => {
      // Non-critical — Storage cleanup failure should never break the UX flow
    });

    return { generatedImageUrl: data.generatedImageUrl };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La generación tomó demasiado tiempo. Por favor intenta nuevamente.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
