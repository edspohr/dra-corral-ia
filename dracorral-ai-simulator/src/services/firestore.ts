/**
 * firestore.ts
 * Lead capture service — POC mock using localStorage.
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
  console.info('[Lead] POC mode — storing in localStorage:', payload.email);
  localStorage.setItem('dc_lead_email', payload.email);
  localStorage.setItem('dc_lead_nombre', payload.nombre);
  const mockCode =
    'CORRAL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  localStorage.setItem('dc_lead_code', mockCode);
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { code: mockCode, isExisting: false };
};
