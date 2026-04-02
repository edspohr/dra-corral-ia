/**
 * gemini.ts
 * AI image generation service for Dra. Corral Beauty Simulator.
 *
 * Strategy:
 * 1. If VITE_FUNCTIONS_BASE_URL is set, try the Cloud Function proxy
 *    → on ANY failure (404, CORS, timeout, network error), fall back to direct
 * 2. Direct mode: browser calls Gemini API directly (POC / fallback)
 *    → Try gemini-3-pro-image-preview (Nano Banana Pro) first
 *    → Fall back to gemini-2.5-flash-preview-04-17
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Procedure } from '../data/procedures';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface GeminiImageRequest {
  photoBase64: string;       // base64 WITHOUT data URL prefix
  photoMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  selectedProcedures: Procedure[];
}

export interface GeminiImageResult {
  imageDataUrl: string;      // complete data: URL for <img src>
  modelUsed: string;
  generationTimeMs: number;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildGenerationPrompt = (procedures: Procedure[]): string => {
  const effectDescriptions = procedures
    .map(p => `• ${p.name}: ${p.aiPromptEffect}`)
    .join('\n');

  return `You are a medical aesthetics visualization specialist creating a \
realistic "after treatment" portrait for a Chilean aesthetic medicine clinic.

REFERENCE PERSON: The attached photograph shows the patient. Study their:
- Exact facial structure, bone features, and proportions
- Skin tone and undertones
- Eye shape and color
- Unique facial characteristics that make them recognizable
- Current hair, makeup (if any), and background setting

YOUR TASK: Generate a single photorealistic portrait of THE SAME PERSON \
showing the natural, clinically accurate results of these aesthetic procedures:

${effectDescriptions}

MANDATORY RULES — violating any of these ruins the output:
1. IDENTITY PRESERVATION (most critical): The generated person must be \
   immediately recognizable as the same individual. Same face, same structure,
   same eyes, same ethnicity. This is non-negotiable.
2. CLINICAL SUBTLETY: Results must look like a skilled medical professional \
   performed them — natural, not overdone, never cartoon-like or surgical.
3. LIGHTING ENHANCEMENT: Subtly improve skin illumination. Add soft, flattering \
   light from slightly above. Skin should look hydrated, healthy, radiant.
4. COMPOSITION MATCH: Same angle, same framing, same head position as the \
   reference photo. Match the background as closely as possible.
5. PHOTOGRAPHY QUALITY: The output must look like a professional beauty portrait \
   taken in a clinical setting — clean, sharp, authentic.
6. NO TEXT: Do not add any text, watermarks, or annotations to the image.

Generate the single "after treatment" portrait now.`;
};

// ─── Error class ──────────────────────────────────────────────────────────────

export class GeminiApiError extends Error {
  readonly userMessage: string;
  readonly technical: string;

  constructor(message: string, userMessage: string, technical: string) {
    super(message);
    this.name = 'GeminiApiError';
    this.userMessage = userMessage;
    this.technical = technical;
  }
}

// ─── Per-model generation ─────────────────────────────────────────────────────
// All Nano Banana image models require responseModalities to return image parts.

const generateWithModel = async (
  modelName: string,
  request: GeminiImageRequest,
): Promise<GeminiImageResult | null> => {
  const startTime = Date.now();
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        // @ts-expect-error: responseModalities not yet in all SDK type definitions
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });
    const result = await model.generateContent([
      { inlineData: { data: request.photoBase64, mimeType: request.photoMimeType } },
      { text: buildGenerationPrompt(request.selectedProcedures) },
    ]);
    for (const part of result.response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          imageDataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          modelUsed: modelName,
          generationTimeMs: Date.now() - startTime,
        };
      }
    }
    console.warn(`[AI] ${modelName} returned no image part`);
    return null;
  } catch (error) {
    console.warn(`[AI] ${modelName} failed:`, (error as Error).message);
    return null;
  }
};

// Waterfall: Pro (best quality) → Nano Banana 2 (fast) → Nano Banana (stable)
const IMAGE_MODELS = [
  'gemini-3-pro-image-preview',    // Nano Banana Pro
  'gemini-3.1-flash-image-preview', // Nano Banana 2
  'gemini-2.5-flash-image',         // Nano Banana (stable)
];

// ─── Direct browser call (used as primary path or fallback) ──────────────────

const generateDirectFromBrowser = async (
  request: GeminiImageRequest,
): Promise<GeminiImageResult> => {
  if (!API_KEY || API_KEY.includes('your_')) {
    throw new GeminiApiError(
      'Missing API key',
      'Error de configuración del servicio de IA.',
      'VITE_GEMINI_API_KEY is not set in .env.local',
    );
  }
  for (const modelName of IMAGE_MODELS) {
    const result = await generateWithModel(modelName, request);
    if (result) {
      console.info(`[AI] ✓ Generated with ${result.modelUsed} in ${result.generationTimeMs}ms`);
      return result;
    }
  }
  throw new GeminiApiError(
    'All models failed',
    'No pudimos generar tu imagen. Por favor intenta nuevamente en 30 segundos.',
    'All three Nano Banana models returned no image data',
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateBeautySimulation = async (
  request: GeminiImageRequest,
): Promise<GeminiImageResult> => {
  const functionsBaseUrl = (import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined)?.trim();

  // Proxy mode: try Cloud Function, fall back to direct on any failure
  if (functionsBaseUrl) {
    try {
      const response = await fetch(`${functionsBaseUrl}/generateImage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: request.photoBase64,
          photoMimeType: request.photoMimeType,
          procedureNames: request.selectedProcedures.map(p => p.name),
          procedureEffects: request.selectedProcedures.map(p => p.aiPromptEffect),
        }),
        signal: AbortSignal.timeout(130_000),
      });

      if (!response.ok) {
        console.warn(`[AI] Cloud Function returned ${response.status} — falling back to direct call`);
        return generateDirectFromBrowser(request);
      }

      const data = await response.json() as { imageDataUrl: string; modelUsed: string };
      console.info(`[AI] ✓ Generated via Function with ${data.modelUsed}`);
      return {
        imageDataUrl: data.imageDataUrl,
        modelUsed: `[via Function] ${data.modelUsed}`,
        generationTimeMs: 0,
      };
    } catch (error) {
      console.warn(
        '[AI] Cloud Function unreachable — falling back to direct call:',
        (error as Error).message,
      );
      return generateDirectFromBrowser(request);
    }
  }

  // Direct mode (POC / no function URL configured)
  return generateDirectFromBrowser(request);
};
