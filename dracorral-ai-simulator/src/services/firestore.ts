/**
 * firestore.ts
 * Lead capture service — calls Firebase Cloud Function.
 * Falls back to a local mock in POC mode (when VITE_FUNCTIONS_BASE_URL is empty).
 */

export interface LeadPayload {
  nombre: string;
  email: string;
  telefono: string;
  sessionId: string;
  procedures: string[];
}

export interface LeadResult {
  code: string;
  isExisting: boolean;
}

export const submitLead = async (payload: LeadPayload): Promise<LeadResult> => {
  const functionsBaseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined;

  // POC mode: simulate lead save locally
  if (!functionsBaseUrl) {
    console.info('[Lead] POC mode — storing in localStorage:', payload.email);
    localStorage.setItem('dc_lead_email', payload.email);
    localStorage.setItem('dc_lead_nombre', payload.nombre);
    const mockCode =
      'CORRAL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    localStorage.setItem('dc_lead_code', mockCode);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { code: mockCode, isExisting: false };
  }

  // Production mode: call Cloud Function
  const response = await fetch(`${functionsBaseUrl}/saveLead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(
      body.error ?? 'Error al guardar tus datos. Intenta nuevamente.',
    );
  }

  return response.json() as Promise<LeadResult>;
};
