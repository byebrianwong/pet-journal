# Pet Journal

A React Native + Expo app for tracking a pet's life across multiple caregivers. Built around a unified day-icon heatmap and a chip-based quick-capture sheet, with Supabase for auth + realtime sharing.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + publishable key
npm start              # or npm run web for the browser preview
```

## Supabase setup

1. Create a Supabase project at https://supabase.com
2. Paste `supabase/schema.sql` into the SQL Editor and run it once (idempotent — safe to re-run)
3. Copy your project URL + publishable key from Settings → API into `.env`

## Development

- `npm run web` — Expo dev server in the browser
- `npm run ios` / `npm run android` — native simulators
- `npm run storybook` — component story preview at http://localhost:6006
- `npm run build-storybook` — static Storybook build

## Visual review with Chromatic

Every PR runs a visual review against the Storybook stories so reviewers can see UI changes alongside code changes.

One-time setup:

1. Sign up at https://www.chromatic.com and link this repo
2. Copy the project token Chromatic gives you
3. Add it to GitHub: Settings → Secrets and variables → Actions → New repository secret → `CHROMATIC_PROJECT_TOKEN`
4. Push any PR to trigger the first build

Until the token is set the `Chromatic` GitHub check will warn-and-skip rather than block PRs.

## Project structure

```
src/
  components/   reusable UI primitives (PetHeader, HeatmapStrip, QuickCaptureSheet, ...)
  screens/      top-level routes (Timeline, Heatmap, AddPet, ...)
  services/     Supabase + Fi + Anthropic clients
  utils/        feedback, dates, day-icon classifier, suggestion engine
supabase/
  schema.sql    full database setup (idempotent)
  patch-*.sql   one-off migrations for incremental fixes
.storybook/     Storybook config + service mocks for offline story rendering
docs/wireframes initial design wireframes
```

## Contributing

Branch first — `feat/...`, `fix/...`, `chore/...`. Land via PR, never direct to main. See `CLAUDE.md` for the rule.
