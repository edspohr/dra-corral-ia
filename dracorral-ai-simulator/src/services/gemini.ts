/**
 * gemini.ts
 * AI image generation service for Dra. Corral Beauty Simulator.
 *
 * Strategy:
 * 1. Try Nano Banana Pro (gemini-3-pro-image-preview) — highest quality
 * 2. Fallback to Gemini 2.5 Flash with image output modality
 *
 * POC NOTE: API key is accessed directly from browser.
 * In production, all calls must be proxied through Firebase Cloud Functions.
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

// ─── Primary: Nano Banana Pro ─────────────────────────────────────────────────

const generateWithNanaBananaPro = async (
  request: GeminiImageRequest,
): Promise<GeminiImageResult | null> => {
  const startTime = Date.now();
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: request.photoBase64,
          mimeType: request.photoMimeType,
        },
      },
      { text: buildGenerationPrompt(request.selectedProcedures) },
    ]);

    const response = result.response;

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          imageDataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          modelUsed: 'gemini-3-pro-image-preview (Nano Banana Pro)',
          generationTimeMs: Date.now() - startTime,
        };
      }
    }

    // Model returned text only — trigger fallback
    console.warn('[AI] Nano Banana Pro returned text only — falling back to Gemini 2.5 Flash');
    return null;
  } catch (error) {
    console.warn('[AI] Nano Banana Pro unavailable:', (error as Error).message);
    return null;
  }
};

// ─── Fallback: Gemini 2.5 Flash with image output ────────────────────────────

const generateWithGemini25Flash = async (
  request: GeminiImageRequest,
): Promise<GeminiImageResult> => {
  const startTime = Date.now();
  const genAI = new GoogleGenerativeAI(API_KEY);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17',
    generationConfig: {
      // @ts-expect-error: responseModalities is supported but not yet in type definitions
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: request.photoBase64,
        mimeType: request.photoMimeType,
      },
    },
    { text: buildGenerationPrompt(request.selectedProcedures) },
  ]);

  const response = result.response;

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return {
        imageDataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        modelUsed: 'gemini-2.5-flash-preview-04-17',
        generationTimeMs: Date.now() - startTime,
      };
    }
  }

  throw new Error(
    'Neither Nano Banana Pro nor Gemini 2.5 Flash returned an image. ' +
    'Check API key, quota, and model availability.',
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

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

export const generateBeautySimulation = async (
  request: GeminiImageRequest,
): Promise<GeminiImageResult> => {
  const startTime = Date.now();

  // ── Proxy mode: route through Firebase Cloud Function ──────────────────────
  const functionsBaseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined;
  if (functionsBaseUrl) {
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
      const err = await response.json().catch(() => ({})) as { error?: string };
      throw new GeminiApiError(
        `Function error: ${response.status}`,
        'No pudimos generar tu imagen. Por favor intenta nuevamente.',
        err.error ?? 'Unknown function error',
      );
    }

    const data = await response.json() as { imageDataUrl: string; modelUsed: string };
    console.info(`[AI] ✓ Generated via Function with ${data.modelUsed} in ${Date.now() - startTime}ms`);
    return {
      imageDataUrl: data.imageDataUrl,
      modelUsed: `[via Function] ${data.modelUsed}`,
      generationTimeMs: Date.now() - startTime,
    };
  }

  // ── Direct mode (POC): browser calls Gemini API directly ──────────────────
  if (!API_KEY || API_KEY.includes('your_')) {
    throw new GeminiApiError(
      'Missing API key',
      'Error de configuración del servicio de IA.',
      'VITE_GEMINI_API_KEY is not set in .env.local',
    );
  }

  const primaryResult = await generateWithNanaBananaPro(request);
  if (primaryResult) {
    console.info(
      `[AI] ✓ Generated with ${primaryResult.modelUsed} in ${primaryResult.generationTimeMs}ms`,
    );
    return primaryResult;
  }

  console.info('[AI] Using Gemini 2.5 Flash fallback...');
  const fallbackResult = await generateWithGemini25Flash(request);
  console.info(
    `[AI] ✓ Generated with ${fallbackResult.modelUsed} in ${fallbackResult.generationTimeMs}ms`,
  );
  return fallbackResult;
};
