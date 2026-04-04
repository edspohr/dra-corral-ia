/**
 * envCheck.ts
 * Development-only check for required environment variables.
 * Called from main.tsx in DEV mode only — stripped from production builds.
 */

export const checkRequiredEnvVars = (): void => {
  const required = ['VITE_GEMINI_API_KEY'];

  const missing = required.filter(
    (key) =>
      !import.meta.env[key] ||
      (import.meta.env[key] as string).includes('your_'),
  );

  if (missing.length > 0) {
    console.error(
      '[Config] Missing or unconfigured environment variables:\n' +
      missing.map((k) => `  • ${k}`).join('\n') +
      '\n  Copy .env.example to .env.local and fill in the values.',
    );
  }
};
