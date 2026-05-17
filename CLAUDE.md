# Crosstune

A crossword puzzle web app with daily puzzles, themed puzzles, archives, and a puzzle creator. Users can play, create, and share crossword puzzles with music. Audio previews are served via the Apple Music Catalog API (migrated off SoundCloud in 2026-05 due to DRM playback breakage on Chromium).

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
  - `api/` — Server endpoints (apple-music-preview, search-apple-music, create-puzzle, solve, submit-puzzle, track-click, usage, puzzles, probe-track, audit-tracks, validate-soundcloud)
  - `archives/`, `themed/`, `create/`, `puzzles/` — Puzzle pages
  - `auth/`, `login/`, `profile/` — Auth flows
  - `monitor/` — Monitoring page
- `src/lib/components/` — Svelte components (CrosswordGrid1, SplashScreen, Navbar, etc.)
- `src/lib/stores/` — Svelte stores (auth, game, theme use `.svelte.js`; others are plain `.js`)
- `src/lib/data/` — Static puzzle data JSON files (`crosswords.json`, `themed_crosswords.json`)
- `src/lib/utils/` — Utility modules
- `migrations/` — Cloudflare D1 SQL migration files
- `scripts/` — One-off Node scripts (e.g. SoundCloud → Apple Music data migration: `enrich-soundcloud.js`, `match-itunes.js`)
- `static/` — Static assets (images, robots.txt)

## Key Conventions

- Svelte 5 syntax: use runes (`$state`, `$derived`, `$effect`) not legacy `$:` reactivity
- Stores that use runes have the `.svelte.js` extension
- Auth is handled via `hooks.server.js` — Supabase client is on `event.locals.supabase`
- Session access: `event.locals.safeGetSession()` (cached per request)
- Dark mode: Tailwind `selector` strategy (class-based)
- Environment variables: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` via `$env/static/public`; `MUSICKIT_TEAM_ID` / `MUSICKIT_KEY_ID` / `MUSICKIT_PRIVATE_KEY` (base64-encoded PEM) for Apple Music JWT
- D1 binding: accessed as `platform.env['solve-db']` in server routes
- Music previews: words reference Apple Music tracks via the `itunesId` field (legacy name — value is an Apple Music Catalog song ID). JWT generation in `src/lib/utils/musickit.server.js`; client fetches previews from `/api/apple-music-preview?id=…` then plays the returned `previewUrl` in an `<audio>` element. Never proxy audio bytes server-side.
