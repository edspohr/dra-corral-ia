import { GoogleGenerativeAI } from '@google/generative-ai';

// POC NOTE: In production, this call must be proxied through a Firebase Function
// to keep the API key server-side. For POC/demo purposes only, key is in .env.local.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface GeminiRequest {
  photoBase64: string;          // base64 string WITHOUT the data:image/xxx;base64, prefix
  photoMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  procedures: {
    id: string;
    name: string;
    zone?: string;
    intensity?: string;
  }[];
}

export interface GeminiResult {
  generatedImageUrl: string;    // data: URL ready for <img src>
  modelUsed: string;
}

// ── Prompt builder ─────────────────────────────────────────────────────────

const buildPrompt = (procedures: GeminiRequest['procedures']): string => {
  const procedureList = procedures
    .map((p) => {
      const details: string[] = [];
      if (p.zone) details.push(`zone: ${p.zone}`);
      if (p.intensity) details.push(`intensity: ${p.intensity}`);
      return `- ${p.name}${details.length ? ` (${details.join(', ')})` : ''}`;
    })
    .join('\n');

  return `You are a medical aesthetics visualization specialist.

Analyze this person's facial photograph and generate a photorealistic portrait
showing the natural, subtle results of these non-invasive cosmetic procedures:

${procedureList}

MANDATORY RULES — follow all of them strictly:
1. PRESERVE IDENTITY: maintain 100% of the person's facial structure, bone features,
   ethnicity, eye color, and unique characteristics. The person must be recognizable.
2. NATURAL RESULTS: outcomes must look clinical and understated — never overdone,
   never surgical, never cartoon-like. These are micro-corrections, not transformations.
3. LIGHTING: subtly improve skin lighting — add a soft, flattering glow from slightly
   above. Skin should look hydrated and healthy.
4. COMPOSITION: maintain exact same angle, framing, background, and head position.
5. QUALITY: output must look like a professional medical photography portrait.
6. Botox/Toxin rules: relax expression lines only in specified zones; preserve
   facial movement and expressiveness.
7. Hyaluronic acid rules: add subtle volume in specified zones; avoid pillow-face.
8. Skin booster rules: improve skin texture and add radiance; no structural changes.
9. Biorevitalization rules: improve overall skin luminosity and tone uniformity.

Generate the single "after" portrait image applying these procedures naturally.`;
};

// ── Primary: gemini-3-pro-image-preview ───────────────────────────────────

const tryProModel = async (
  request: GeminiRequest,
): Promise<GeminiResult | null> => {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any,
    });

    const imagePart = {
      inlineData: {
        data: request.photoBase64,
        mimeType: request.photoMimeType,
      },
    };

    const textPart = { text: buildPrompt(request.procedures) };

    const result = await model.generateContent([textPart, imagePart]);
    const response = result.response;

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          generatedImageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          modelUsed: 'gemini-3-pro-image-preview',
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('[Gemini] gemini-3-pro-image-preview unavailable, trying fallback:', err);
    return null;
  }
};

// ── Fallback: gemini-3.1-flash-image-preview ──────────────────────────────

const tryFlashFallback = async (
  request: GeminiRequest,
): Promise<GeminiResult> => {
  const genAI = new GoogleGenerativeAI(API_KEY);

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-image-preview',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any,
  });

  const imagePart = {
    inlineData: {
      data: request.photoBase64,
      mimeType: request.photoMimeType,
    },
  };

  const textPart = { text: buildPrompt(request.procedures) };

  const result = await model.generateContent([textPart, imagePart]);
  const response = result.response;

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return {
        generatedImageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        modelUsed: 'gemini-3.1-flash-image-preview',
      };
    }
  }

  throw new Error('No image returned by gemini-3.1-flash-image-preview');
};

// ── Main export ────────────────────────────────────────────────────────────

export const generateWithGemini = async (
  request: GeminiRequest,
): Promise<GeminiResult> => {
  if (!API_KEY || API_KEY === 'REPLACE_WITH_YOUR_KEY') {
    throw new Error('GEMINI_KEY_MISSING');
  }

  // Cascade: gemini-3-pro-image-preview → gemini-3.1-flash-image-preview
  const primaryResult = await tryProModel(request);
  if (primaryResult) return primaryResult;

  return tryFlashFallback(request);
};
