# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Premium aesthetic medicine AI landing page for **Dra. Corral** (`dracorral.cl`), a Chilean specialist in non-invasive facial procedures. Includes a 4-step AI simulator focused on **ácido hialurónico (hyaluronic acid dermal filler)**: photo upload → zone/effect/intensity selection → AI-generated result → share. Target: women 28–55 in Santiago. **All UI text must be in Spanish.**

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
- **Firebase** (`firebase` v12) — initialised but reserved for future use (POC uses localStorage mock)
- **Google Gemini** (`@google/generative-ai`) — AI image simulation, called directly from the browser
- **Vercel** — deployment target

## Architecture

### Simulator flow (4 steps)

```
App.tsx (useSimulator hook → useReducer)
  ├── Step 1: Step1Email    — email gate (hero header, no top nav)
  ├── Step 2: Step1Photo    — photo upload or live camera capture
  ├── Step 3: Step3Effect   — zone / effect / intensity selection (StepIndicator shown)
  └── Step 4: Step3Result   — AI generation → disclaimer gate → before/after reveal → share
```

### State management

All simulator state lives in `src/hooks/useSimulator.ts` via `useReducer`. The hook exposes typed action creators (`goToStep`, `setEmail`, `setPhoto`, `setSelection`, `generateImage`, etc.). Validation is enforced inside the hook: step 3→4 requires `selection !== null`. `generateImage` is fired exactly once on step 4 entry via a `hasFiredRef` guard in `App.tsx`.

`SimulatorState` fields:
- `step: 1 | 2 | 3 | 4`
- `email`, `photoFile`, `photoPreviewUrl`
- `selection: HyaluronicSelection | null` — `{ zone: ZoneId, effect: EffectId, intensity: IntensityLevel }`
- `generatedImageUrl`, `sessionId`, `isLoading`, `error`

### Component structure

```
src/components/
  layout/    Header.tsx
  ui/        Button.tsx, StepIndicator.tsx
  steps/     Step1Email.tsx, Step1Photo.tsx, Step3Effect.tsx, Step3Result.tsx
```

### Key files

| Path | Purpose |
|------|---------|
| `src/types/index.ts` | `SimulatorState`, `HyaluronicSelection`, re-exports `ZoneId`, `EffectId`, `IntensityLevel` |
| `src/data/hyaluronic.ts` | All treatment data: 6 zones, 6 effects, 3 intensities, `aiPromptEffect` strings, `TREATMENT_INFO` |
| `src/services/gemini.ts` | Direct browser → Gemini image generation; model waterfall (stable → preview → pro) |
| `src/services/firestore.ts` | Lead capture — POC localStorage mock; interface ready for Cloud Function |
| `src/services/firebase.ts` | Lazy-init Firebase app (reserved for future Firestore/Storage use) |
| `src/hooks/useSimulator.ts` | Central state machine via `useReducer` |
| `src/hooks/useCamera.ts` | Camera access hook used in Step 2 (Step1Photo) for live capture |
| `src/utils/imageOptimizer.ts` | Resizes uploads to max 1024px / JPEG 0.88 before AI call |
| `src/utils/shareImage.ts` | Canvas export: 1080×1080 before/after PNG for Instagram download |
| `src/index.css` | Tailwind v4 `@theme` block + CSS custom properties + animation keyframes |

### Design system

- Fonts: `Cormorant Garamond` (headings/display) and `DM Sans` (body/UI) — loaded via Google Fonts in `index.html`
- All CSS tokens defined twice: as Tailwind `@theme` tokens (`--color-gold`, etc.) for `text-gold`, `bg-cream`, etc. utilities, **and** as raw CSS custom properties (`--gold`, etc.) for inline `style=` usage
- Aesthetic: premium, calm, medical-trustworthy — not flashy. Background `var(--cream)`, never pure white
- Mobile-first; all interactive elements min-height 44px

## Environment variables

Copy `.env.example` → `.env.local`. All vars prefixed `VITE_` are inlined at build time:

```
VITE_GEMINI_API_KEY          ← required; powers the AI image generation
VITE_FIREBASE_*              ← optional; Firebase reserved for future use
```

## Tailwind v4 notes

- No `tailwind.config.ts` — theme extensions go in the `@theme {}` block in `src/index.css`
- Color utilities (`text-gold`, `bg-cream-dark`, etc.) map to `--color-*` tokens defined in `@theme`
- Use `style={{ fontFamily: ... }}` inline for serif headings alongside Tailwind classes, since font-family utilities require the `@theme --font-family-*` tokens
