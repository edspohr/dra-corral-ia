# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Premium aesthetic medicine AI landing page for **Dra. Corral** (`dracorral.cl`), a Chilean specialist in non-invasive facial procedures. Includes a 4-step AI simulator: photo upload → treatment selection → AI-generated result → booking. Target: women 28–55 in Santiago. **All UI text must be in Spanish.**

The project lives in `dracorral-ai-simulator/`. All commands below are run from that directory.

## Commands

```bash
npm run dev        # Dev server (http://localhost:5173)
npm run build      # tsc + Vite production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
npx tsc --noEmit   # Type-check only (no output files)
```

## Stack

- **React 19 + TypeScript + Vite 8** — standard Vite project structure
- **Tailwind CSS v4** — CSS-first config via `@theme` in `src/index.css` (no `tailwind.config.ts`; Vite plugin via `@tailwindcss/vite`)
- **Firebase** (`firebase` v12) — Firestore for leads, Storage for photos
- **Google Gemini** (`@google/generative-ai`) — AI image simulation
- **Vercel** — deployment target

## Architecture

### Simulator flow (4 steps)

```
App.tsx (useSimulator hook → useReducer)
  ├── Step 1: Step1Photo    — file upload, preview, validation
  ├── Step 2: Step2Procedures — procedure cards with zone/intensity selectors
  ├── Step 3: Step3Result   — AI-generated before/after (StepIndicator hidden)
  └── Step 4: Step4Booking  — lead capture form → Firestore → confirmation code
```

### State management

All simulator state lives in `src/hooks/useSimulator.ts` via `useReducer`. The hook exposes typed action creators (`goToStep`, `setPhoto`, `updateProcedure`, etc.). Validation is enforced inside the hook: step 1→2 requires a photo; step 2→3 requires ≥1 enabled procedure.

### Component structure

```
src/components/
  layout/    Header.tsx
  ui/        Button.tsx, StepIndicator.tsx
  steps/     Step1Photo.tsx … Step4Booking.tsx
```

### Key files

| Path | Purpose |
|------|---------|
| `src/types/index.ts` | `SimulatorState`, `ProcedureId`, `LeadData`, etc. |
| `src/data/procedures.ts` | Static data for all 4 treatments (copy, zones, intensities) |
| `src/services/firebase.ts` | Lazy-init Firebase app, exports `db` and `storage` |
| `src/hooks/useCamera.ts` | Camera access hook used in Step 1 for live capture |
| `src/utils/imageOptimizer.ts` | Resizes uploads to max 1024px / JPEG 0.88 before AI call |
| `src/index.css` | Tailwind v4 `@theme` block + CSS custom properties |

### Design system

- Fonts: `Cormorant Garamond` (headings/display) and `DM Sans` (body/UI) — loaded via Google Fonts in `index.html`
- All CSS tokens defined twice: as Tailwind `@theme` tokens (`--color-gold`, etc.) for `text-gold`, `bg-cream`, etc. utilities, **and** as raw CSS custom properties (`--gold`, etc.) for inline `style=` usage
- Aesthetic: premium, calm, medical-trustworthy — not flashy. Background `var(--cream)`, never pure white
- Mobile-first; all interactive elements min-height 44px

## Environment variables

Copy `.env.example` → `.env.local`. All vars prefixed `VITE_` are inlined at build time:

```
VITE_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / STORAGE_BUCKET / MESSAGING_SENDER_ID / APP_ID
VITE_GEMINI_API_KEY
```

## Tailwind v4 notes

- No `tailwind.config.ts` — theme extensions go in the `@theme {}` block in `src/index.css`
- Color utilities (`text-gold`, `bg-cream-dark`, etc.) map to `--color-*` tokens defined in `@theme`
- Use `style={{ fontFamily: ... }}` inline for serif headings alongside Tailwind classes, since font-family utilities require the `@theme --font-family-*` tokens
