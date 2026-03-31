import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

setGlobalOptions({ region: 'southamerica-east1', timeoutSeconds: 120 });

const corsHandler = cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://dracorral.cl',
      'https://www.dracorral.cl',
    ];
    // Allow requests with no origin (mobile apps, Postman) and localhost in dev
    if (!origin || allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
});

// ── Types ──────────────────────────────────────────────────────────────────

interface ProcedureInput {
  id: string;
  zone?: string;
  intensity?: string;
}

interface GenerateImageRequest {
  photoBase64: string;
  photoMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  procedures: ProcedureInput[];
  sessionId: string;
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildGeminiPrompt(procedures: ProcedureInput[]): string {
  const procedureDetails = procedures
    .map((p) => {
      const details: string[] = [];
      if (p.zone) details.push(`Zone: ${p.zone}`);
      if (p.intensity) details.push(`Intensity: ${p.intensity}`);
      return `- ${p.id.toUpperCase()}${details.length ? ' (' + details.join(', ') + ')' : ''}`;
    })
    .join('\n');

  return `You are a medical aesthetics visualization expert.

Analyze this person's face and generate a photorealistic image showing the natural, subtle results of the following non-invasive cosmetic procedures:

${procedureDetails}

STRICT GUIDELINES:
- Maintain 100% of the person's identity, bone structure, ethnicity, and facial features
- Results must look NATURAL and CLINICAL — not overdone, not cartoon-like
- Subtly improve lighting to enhance skin glow and texture (soft, flattering light from slightly above)
- For Botox/Toxin: subtly relax expression lines in the specified zones, maintain expressiveness
- For Hyaluronic Acid: add natural volume in specified zones, avoid pillow-face effect
- For Skin Boosters: improve skin texture, add subtle radiance and hydrated appearance
- For Biorevitalization: improve overall skin quality and luminosity
- Keep same angle, framing, and background as original photo
- Final image must look like a professional beauty photograph
- Output: single photorealistic portrait image, same dimensions as input

Generate the "after" result image showing these procedures applied naturally.`;
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate(body: Partial<GenerateImageRequest>): string | null {
  if (!body.photoBase64 || typeof body.photoBase64 !== 'string') {
    return 'Se requiere photoBase64';
  }
  if (!body.photoMimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(body.photoMimeType)) {
    return 'photoMimeType debe ser image/jpeg, image/png o image/webp';
  }
  if (!body.procedures || !Array.isArray(body.procedures) || body.procedures.length === 0) {
    return 'Se requiere al menos un procedimiento';
  }
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    return 'Se requiere sessionId';
  }
  return null;
}

// ── Cloud Function ─────────────────────────────────────────────────────────

export const generateImage = onRequest(
  { timeoutSeconds: 120, memory: '512MiB' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return;
      }

      const body = req.body as Partial<GenerateImageRequest>;
      const validationError = validate(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const { photoBase64, photoMimeType, procedures, sessionId } =
        body as GenerateImageRequest;

      try {
        // ── 1. Call Gemini ────────────────────────────────────────────────
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

        const genAI = new GoogleGenerativeAI(apiKey);
        // imagen-3.0-generate-002 supports image output via generateContent
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp-image-generation',
        });

        const result = await model.generateContent([
          {
            inlineData: {
              data: photoBase64,
              mimeType: photoMimeType,
            },
          },
          { text: buildGeminiPrompt(procedures) },
        ]);

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts;

        // Find the inline image part in the response
        const imagePart = parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
        if (!imagePart?.inlineData) {
          throw new Error('Gemini did not return an image');
        }

        const generatedBase64 = imagePart.inlineData.data;
        const generatedMime = imagePart.inlineData.mimeType as string;
        const ext = generatedMime.split('/')[1] ?? 'jpg';

        // ── 2. Upload to Firebase Storage ─────────────────────────────────
        const bucket = admin.storage().bucket();
        const storagePath = `results/${sessionId}/generated.${ext}`;
        const file = bucket.file(storagePath);

        await file.save(Buffer.from(generatedBase64, 'base64'), {
          metadata: { contentType: generatedMime },
        });

        // Make the file publicly readable
        await file.makePublic();
        const generatedImageUrl = file.publicUrl();

        logger.info('generateImage success', { sessionId, storagePath });
        res.status(200).json({ generatedImageUrl, sessionId });
      } catch (err) {
        logger.error('generateImage error', { sessionId, err });
        res.status(500).json({ error: 'Error al generar imagen. Intenta nuevamente.' });
      }
    });
  },
);
