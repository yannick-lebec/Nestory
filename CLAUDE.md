# Family Memory (Nestory)

"Le journal intelligent de la famille" — a family memory app that captures moments and transforms them into living memories: timelines, smart albums, monthly recaps, time capsules, natural search.

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui
- **Backend (to set up):** Go (Gin/Fiber), Neon (Postgres serverless), Redis, S3-compatible storage (MinIO locally), Asynq for async jobs
- **Infra:** Docker + docker-compose

## Commands

```bash
npm run dev       # Start frontend dev server
npm run build     # Type-check and build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Roadmap

- **Phase 1 — Fondations:** auth, family creation, add memories, photo upload, simple timeline
- **Phase 2 — Expérience cœur:** smart albums, filters, search, family roles, memory detail pages
- **Phase 3 — Effet wow:** AI monthly recap, past memory suggestions, "best of" page
- **Phase 4 — Niveau produit:** PDF print, time capsules, notifications, natural language search, secure sharing

## Key domain objects

`User`, `Family`, `FamilyMember` (roles: parent/enfant/invité), `Memory`, `MemoryMedia`, `Album`, `Recap`, `Tag`, `Person`, `Place`

## Memory categories

`anniversaire`, `vacances`, `école`, `quotidien`, `voyage`, `citation`, `réussite`
