# Crosstune

A crossword puzzle web app with daily puzzles, themed puzzles, archives, and a puzzle creator. Users can play, create, and share crossword puzzles with music (SoundCloud integration).

## Tech Stack

- **Framework:** SvelteKit (Svelte 5) with `@sveltejs/adapter-cloudflare`
- **Styling:** Tailwind CSS v4 (via Vite plugin, not PostCSS)
- **Auth:** Supabase (SSR mode via `@supabase/ssr`)
- **Database:** Cloudflare D1 (`solve-db`) for solve data; Supabase for auth/user data
- **Hosting:** Cloudflare Pages
- **State:** Svelte 5 runes (`$state`, `$derived`, etc.) in `src/lib/stores/`

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npx wrangler d1 execute solve-db --local --file=migrations/<file>.sql` — Run a D1 migration locally

## Project Structure

- `src/routes/` — SvelteKit pages and API routes
  - `api/` — Server endpoints (create-puzzle, solve, submit-puzzle, track-click, usage, validate-soundcloud)
  - `archives/`, `themed/`, `create/`, `puzzles/` — Puzzle pages
  - `auth/`, `login/`, `profile/` — Auth flows
  - `monitor/` — Monitoring page
- `src/lib/components/` — Svelte components (CrosswordGrid1, SplashScreen, Navbar, etc.)
- `src/lib/stores/` — Svelte stores (auth, game, theme use `.svelte.js`; others are plain `.js`)
- `src/lib/data/` — Static puzzle data JSON files (`crosswords.json`, `themed_crosswords.json`)
- `src/lib/utils/` — Utility modules
- `migrations/` — Cloudflare D1 SQL migration files
- `static/` — Static assets (images, robots.txt)

## Key Conventions

- Svelte 5 syntax: use runes (`$state`, `$derived`, `$effect`) not legacy `$:` reactivity
- Stores that use runes have the `.svelte.js` extension
- Auth is handled via `hooks.server.js` — Supabase client is on `event.locals.supabase`
- Session access: `event.locals.safeGetSession()` (cached per request)
- Dark mode: Tailwind `selector` strategy (class-based)
- Environment variables: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` via `$env/static/public`
- D1 binding: accessed as `platform.env['solve-db']` in server routes
