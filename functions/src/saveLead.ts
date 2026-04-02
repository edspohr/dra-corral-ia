import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import cors from 'cors';

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

interface SaveLeadRequest {
  nombre: string;
  email: string;
  telefono: string;
  sessionId: string;
  procedures: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Excludes visually ambiguous chars: 0, O, I, 1
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = 'CORRAL-';
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate(body: Partial<SaveLeadRequest>): string | null {
  if (!body.nombre || body.nombre.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return 'Email inválido';
  }
  if (!body.telefono || !/^\+?[\d\s\-]{8,15}$/.test(body.telefono.trim())) {
    return 'Teléfono inválido (8–12 dígitos)';
  }
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    return 'Se requiere sessionId';
  }
  if (!body.procedures || !Array.isArray(body.procedures) || body.procedures.length === 0) {
    return 'Se requiere al menos un procedimiento';
  }
  return null;
}

// ── Cloud Function ─────────────────────────────────────────────────────────

export const saveLead = onRequest(
  { region: 'southamerica-east1' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return;
      }

      const body = req.body as Partial<SaveLeadRequest>;
      const validationError = validate(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const { nombre, email, telefono, sessionId, procedures } =
        body as SaveLeadRequest;
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const db = admin.firestore();
        const leadsRef = db.collection('leads');

        // ── 1. Dedup: return existing code if email already registered ────
        const existing = await leadsRef
          .where('email', '==', normalizedEmail)
          .limit(1)
          .get();

        if (!existing.empty) {
          const existingCode = existing.docs[0].data().code as string;
          logger.info('saveLead duplicate', { email: normalizedEmail, code: existingCode });
          res.status(200).json({ code: existingCode, success: true });
          return;
        }

        // ── 2. Write new lead ─────────────────────────────────────────────
        const code = generateCode();

        await leadsRef.doc(sessionId).set({
          nombre: nombre.trim(),
          email: normalizedEmail,
          telefono: telefono.trim(),
          sessionId,
          code,
          procedures,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('saveLead created', { sessionId, code });
        res.status(200).json({ code, success: true });
      } catch (err) {
        logger.error('saveLead error', { sessionId, err });
        res.status(500).json({ error: 'Error al guardar tus datos. Intenta nuevamente.' });
      }
    });
  },
);
