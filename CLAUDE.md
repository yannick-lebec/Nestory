# Family Memory (Nestory)

"Le journal intelligent de la famille" — a family memory app that captures moments and transforms them into living memories: timelines, smart albums, monthly recaps, time capsules, natural search.

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui
- **Backend:** Go (Gin), Neon (Postgres serverless), Supabase Storage (S3-compatible)
- **Infra:** Vercel (frontend), Render (backend), Neon (DB), Supabase (storage)

## Commands

```bash
npm run dev                          # Start frontend dev server
npm run build                        # Type-check and build
cd backend && go run ./cmd/api       # Start backend
```

## Production URLs

| Service | URL |
|---|---|
| Frontend | https://nestory-olive.vercel.app |
| Backend | https://nestory-i8xx.onrender.com |
| DB | Neon project "Nestory", eu-central-1 |
| Storage | Supabase bucket `nestory-media` |

## Roadmap & État

### Phase 1 ✅ — Fondations
- Auth (register, login, JWT), family creation, add memories, photo upload, timeline

### Phase 2 ✅ — Expérience cœur
- Smart albums (client-side par catégorie/personne/année)
- Search avec filtres catégorie
- Memory detail page avec lightbox
- Import masse : drag & drop, groupement EXIF par jour, confirmation bulk
- Suppression depuis timeline et albums

### Phase 3 ✅ — Effet wow
- **PhotoLightbox** : plein écran, navigation prev/next + clavier
- **Récap mensuel IA** : souvenirs groupés par catégorie, description Claude Haiku par souvenir (vision), appels parallèles max 3
  - Skip appel Anthropic si le souvenir a déjà une description utilisateur
  - Grille affiche toutes les photos de tous les souvenirs (pas juste la cover)
- **Invitations famille** : lien avec code 8 chars, valable 7 jours, rôles parent/enfant/invité
  - `POST /families/:id/invite` — parents uniquement
  - `POST /families/join` — rejoindre par code
  - Page `/family` : liste membres + génération lien
  - Page `/join?code=...` : rejoindre (redirige vers register/login si non connecté)
- **Navigation mobile** : drawer latéral gauche (hamburger) avec tous les items
- **vercel.json** : rewrites SPA pour éviter les 404 sur URLs directes

### Phase 4 — À faire
- Time capsules
- Export PDF du récap
- Notifications (rappels anniversaires, "il y a 1 an")
- Recherche en langage naturel (Claude)
- Partage sécurisé externe

## Key domain objects

`User`, `Family`, `FamilyMember` (roles: parent/child/guest), `Memory`, `MemoryMedia`, `Album`, `Recap`, `Invitation`

## Memory categories

`anniversaire`, `vacances`, `école`, `quotidien`, `voyage`, `citation`, `réussite`

## DB Migrations

- `001_init.sql` — tables de base (users, families, family_members, memories, memory_media, tags, people, recaps)
- `002_invitations.sql` — table `family_invitations` (déjà exécutée sur Neon)

## Notes techniques

- API client (`src/lib/api.ts`) : conversion automatique snake_case → camelCase
- Auth JWT : token sans family_id, passé via header `X-Family-Id`
- Storage S3 région `auto` (requis par Supabase)
- `ANTHROPIC_API_KEY` requis pour les récaps IA (compte console.anthropic.com)
