/**
 * gemini.ts
 * AI image generation service for Dra. Corral Beauty Simulator.
 * Calls Gemini image models directly from the browser (POC mode).
 * Waterfall: Stable first → Preview → Pro (stability over quality).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { HyaluronicSelection } from '../types';
import { ZONES } from '../data/hyaluronic';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface GeminiImageRequest {
  photoBase64: string;       // base64 WITHOUT data URL prefix
  photoMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  selection: HyaluronicSelection;
}

export interface GeminiImageResult {
  imageDataUrl: string;      // complete data: URL for <img src>
  modelUsed: string;
  generationTimeMs: number;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildGenerationPrompt = (selection: HyaluronicSelection): string => {
  const zone = ZONES.find((z) => z.id === selection.zone)!;
  const effectDescription = zone.aiPromptEffect[selection.intensity];

  return `You are a medical aesthetics visualization specialist creating a \
realistic "after treatment" portrait for a Chilean aesthetic medicine clinic.

TREATMENT: Hyaluronic acid dermal filler applied to the ${zone.name} area.

REFERENCE PERSON: The attached photograph shows the patient. Study their:
- Exact facial structure, bone features, and proportions
- Skin tone and undertones
- Eye shape and color
- Unique facial characteristics that make them recognizable
- Current hair, makeup (if any), and background setting

YOUR TASK: Generate a single photorealistic portrait of THE SAME PERSON \
showing the natural, clinically accurate result of this hyaluronic acid treatment:

${effectDescription}

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
7. SINGLE TREATMENT: This is a SINGLE TREATMENT simulation. Only modify the \
   ${zone.name} area. Leave all other facial areas completely untouched.

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
  console.info(`[AI] Attempting ${modelName}…`);
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
      { text: buildGenerationPrompt(request.selection) },
    ]);
    for (const part of result.response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const ms = Date.now() - startTime;
        console.info(`[AI] ✓ ${modelName} succeeded in ${ms}ms`);
        return {
          imageDataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          modelUsed: modelName,
          generationTimeMs: ms,
        };
      }
    }
    console.warn(`[AI] ${modelName} returned no image part`);
    return null;
  } catch (error) {
    console.warn(`[AI] ${modelName} failed: ${(error as Error).message}`);
    return null;
  }
};

// Waterfall: Stable first (reliability), then preview models (quality)
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',           // Nano Banana (Stable) — most reliable
  'gemini-3.1-flash-image-preview',   // Nano Banana 2 (Preview) — better quality
  'gemini-3-pro-image-preview',       // Nano Banana Pro (Preview) — best quality
];

// ─── Direct browser generation ────────────────────────────────────────────────

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
    if (result) return result;
  }
  throw new GeminiApiError(
    'All models failed',
    'No pudimos generar tu imagen. Por favor intenta nuevamente en 30 segundos.',
    'All three Nano Banana models returned no image data',
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateBeautySimulation = (
  request: GeminiImageRequest,
): Promise<GeminiImageResult> => generateDirectFromBrowser(request);
