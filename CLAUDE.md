# week1-app

A Notion-like note-taking web app. Notes are stored in the browser (localStorage); there is no backend.

## Stack
- React 19 + TypeScript, built with Vite
- State: React `useReducer` + Context (no state library)
- Tests: Vitest + jsdom + React Testing Library
- Lint: oxlint

## Commands
- Test: `npm test`
- Test (watch mode): `npm run test:watch`
- Dev server: `npm run dev`
- Build (includes type check): `npm run build`
- Lint: `npm run lint`

## Rules
- Run the tests after every change.
- Keep all colors as CSS variables in `src/index.css` (needed for dark mode).
- Put state changes in the pure reducer so they stay easy to test.
