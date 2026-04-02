import { onRequest, Request, Response } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

setGlobalOptions({ region: 'southamerica-east1', timeoutSeconds: 120 });

const corsHandler = cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://dracorral.cl',
      'https://www.dracorral.cl',
      'https://dra-corral-ia.vercel.app',
    ];
    if (!origin || allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
});

// ── Types ──────────────────────────────────────────────────────────────────

interface GenerateImageBody {
  photoBase64: string;
  photoMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  procedureNames: string[];
  procedureEffects: string[];
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(procedureNames: string[], procedureEffects: string[]): string {
  const effectList = procedureNames
    .map((name, i) => `• ${name}: ${procedureEffects[i] ?? ''}`)
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

${effectList}

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
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate(body: Partial<GenerateImageBody>): string | null {
  if (!body.photoBase64 || typeof body.photoBase64 !== 'string') {
    return 'Se requiere photoBase64';
  }
  if (!body.photoMimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(body.photoMimeType)) {
    return 'photoMimeType debe ser image/jpeg, image/png o image/webp';
  }
  if (!body.procedureNames || !Array.isArray(body.procedureNames) || body.procedureNames.length === 0) {
    return 'Se requiere al menos un procedimiento en procedureNames';
  }
  if (!body.procedureEffects || !Array.isArray(body.procedureEffects)) {
    return 'Se requiere procedureEffects';
  }
  return null;
}

// ── Cloud Function ─────────────────────────────────────────────────────────

export const generateImage = onRequest(
  {
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: ['GOOGLE_AI_KEY'],
  },
  (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return;
      }

      const body = req.body as Partial<GenerateImageBody>;
      const validationError = validate(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const { photoBase64, photoMimeType, procedureNames, procedureEffects } =
        body as GenerateImageBody;

      const apiKey = process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        logger.error('GOOGLE_AI_KEY secret not configured');
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = buildPrompt(procedureNames, procedureEffects);
        const imageParts = [
          { inlineData: { data: photoBase64, mimeType: photoMimeType } },
          { text: prompt },
        ];

        // ── 1. Try newer native image models (no responseModalities) ──────────
        const NATIVE_MODELS = [
          'gemini-3-pro-image-preview',
          'gemini-3.1-flash-image-preview',
          'gemini-2.5-flash-image',
        ];

        let imageDataUrl: string | null = null;
        let modelUsed = '';

        for (const modelName of NATIVE_MODELS) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(imageParts);
            for (const part of result.response.candidates?.[0]?.content?.parts ?? []) {
              if (part.inlineData?.mimeType?.startsWith('image/')) {
                imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                modelUsed = modelName;
                break;
              }
            }
            if (imageDataUrl) break;
            logger.warn(`${modelName} returned no image part — trying next`);
          } catch (e) {
            logger.warn(`${modelName} failed — trying next`, e);
          }
        }

        // ── 2. Proven fallback: Gemini 2.5 Flash with responseModalities ──────
        if (!imageDataUrl) {
          logger.info('Falling back to gemini-2.5-flash-preview-04-17 with responseModalities');
          const fallbackModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-preview-04-17',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any,
          });
          const fallbackResult = await fallbackModel.generateContent(imageParts);
          for (const part of fallbackResult.response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              modelUsed = 'gemini-2.5-flash-preview-04-17';
              break;
            }
          }
        }

        if (!imageDataUrl) {
          throw new Error('No image returned by any model');
        }

        logger.info('generateImage success', { modelUsed });
        res.status(200).json({ imageDataUrl, modelUsed });
      } catch (err) {
        logger.error('generateImage error', err);
        res.status(500).json({ error: 'Error al generar imagen. Intenta nuevamente.' });
      }
    });
  },
);
