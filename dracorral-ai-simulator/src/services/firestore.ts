const FUNCTIONS_BASE_URL =
  (import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined) ??
  'http://127.0.0.1:5001/dracorral-simulator/southamerica-east1';

interface SaveLeadPayload {
  nombre: string;
  email: string;
  telefono: string;
  sessionId: string;
  procedures: string[];
}

/**
 * Submit lead data to the saveLead Cloud Function.
 * The function deduplicates by email and returns a stable code.
 */
export async function saveLead(data: SaveLeadPayload): Promise<{ code: string }> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/saveLead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Error al guardar tus datos. Intenta nuevamente.');
  }

  const result = (await response.json()) as { code: string; success: boolean };
  return { code: result.code };
}
