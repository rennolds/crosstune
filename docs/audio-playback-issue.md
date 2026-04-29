# Audio playback issue — investigation notes

Living doc tracking what we've confirmed and what we still don't know about
the recent SoundCloud playback failures on non-WebKit browsers. Update as
we learn more.

## TL;DR

SoundCloud has begun shipping AES-encrypted HLS audio variants
(`cbc-encrypted-hls` for FairPlay, `ctr-encrypted-hls` for Widevine) for
major-label tracks. Safari (any), iPhone (any browser, all use WebKit), and
Firefox on Mac play these fine. The SoundCloud iframe embed widget on
Chromium browsers (Chrome, Edge, etc.) fails to complete the EME license
handshake for the encrypted variants, so playback never starts and we mark
the clue unavailable. There is no setting, embed parameter, or API flag we
can flip to fix it on SoundCloud's end.

## Confirmed findings

### Symptom
- On Chrome and Edge desktop, many song clips fail to play. Our existing
  "report unavailable + auto-reveal answer" path fires, so the puzzle still
  solves but audio is gone.
- Per spot tests: roughly 75% of clues affected. Catalog-wide audit
  endpoint exists (`/api/audit-tracks`) — exact percentage TBD.
- Failures are deterministic per-track: the same track always fails for the
  same browser, not a timing race.

### Root cause
- SoundCloud's track hydration JSON (visible in the SSR'd canonical track
  page under `window.__sc_hydration`) shows two new transcoding protocols
  appearing on major-label tracks:
  - `cbc-encrypted-hls` (`audio/mp4`, AAC) — Apple FairPlay packaging
  - `ctr-encrypted-hls` (`audio/mp4`, AAC) — Widevine/PlayReady packaging
- Safari plays the FairPlay variant natively via macOS/iOS CDM.
- Chrome ships Widevine and *should* play the CTR variant, but the
  SoundCloud embed widget's Chromium code path doesn't complete the EME
  license-acquisition handshake — playback silently never starts and
  `isPaused()` returns true after `play()`.
- Even when a `progressive` MP3 fallback transcoding is also listed, the
  widget commits to the encrypted variant and doesn't fall back.

### Discriminator across the catalog
A track's susceptibility depends entirely on its transcodings list:
- **Healthy**: no encrypted-hls transcoding present. Plays everywhere.
- **Encrypted with progressive fallback**: encrypted-hls + a
  `progressive` MP3 transcoding. Currently fails in Chrome via the embed
  widget. *Recoverable* by bypassing the widget and pointing a plain
  `<audio>` element at the resolved progressive stream URL.
- **Encrypted-only**: encrypted-hls and no progressive transcoding.
  *Unrecoverable* without implementing the EME handshake ourselves
  (impractical — see "Why we can't fix the player").

### Browser/device matrix (what we've actually verified)
- **iPhone (any browser)**: ✓ confirmed working. All iPhone browsers use
  WebKit, so they share Safari's playback path.
- **Safari on Mac**: ✓ confirmed working.
- **Firefox on Mac**: ✓ confirmed working.
- **Chrome on Mac/Windows/Linux**: ✗ confirmed broken on encrypted tracks.
- **Edge on desktop**: ✗ confirmed broken (same Chromium code path).
- All other combinations: see Open questions.

### Today's puzzle (2026-04-29) — verified
- ✓ SEEB (Mike Posner): no encrypted-hls
- ✓ ROSE (Rosé fan reupload): no encrypted-hls
- ✗ GOMEZ (Selena Gomez): encrypted-only, no progressive — unrecoverable
- ✗ WONDERWALL (Oasis): encrypted + progressive — recoverable
- ✗ BEYONCE: encrypted + progressive — recoverable

### What didn't fix it (false leads)
- Reverting `fa01abb` (audio cleanup on unmount): fa01abb didn't touch the
  unavailability detection. No effect.
- Reverting `8d3032b` (300ms isPaused timer + clearWidgetState): the bug is
  upstream of any timing logic. No effect. Did re-introduce the wrong-song
  bug 8d3032b had fixed.
- Hypothesis "tracks from official artist accounts are blocked": disproven
  by SEEB, which is uploaded under `mikeposner` (an official artist
  account) and plays fine.

### Why we can't fix the player cleanly
1. **Implementing the EME handshake ourselves** would require
   reverse-engineering SoundCloud's license-server flow, which is
   undocumented, behind their private client_id, and rotates. Even if we
   got it working today, it'd break on their next widget rev. Clear ToS
   violation.
2. **Direct progressive-stream playback (the workaround on the
   `audio/progressive-fallback` branch)** works for tracks that still
   expose a `progressive` transcoding — roughly half of currently-broken
   tracks. Costs: bypasses SoundCloud's ad insertion on `MONETIZE` tracks
   (clearer ToS gray), requires scraping a public client_id from their
   homepage JS bundle (rotates periodically), and doesn't help
   encrypted-only tracks at all. Treated explicitly as a stopgap.
3. **Hoping SoundCloud fixes their own widget**: possible, but no public
   commitment, no ETA, and the encryption rollout itself is expanding.

## Code/state on main right now

- **Audio playback code**: reverted to pre-`fa01abb` / pre-`8d3032b` state
  (matches `0fc98fa`, the last commit before any of the recent audio work).
  This re-introduces the wrong-song bug `8d3032b` had fixed but is the
  closest thing to a confirmed-working baseline.
- **Diagnostic instrumentation** (additive only):
  - `/api/probe-track?url=…|?id=…|?ids=…|?date=…` — fetches a track's
    SoundCloud hydration data, returns transcodings + relevant flags.
  - `/api/audit-tracks?from=…&to=…` — bulk-scans all tracks in a date
    range, deduplicates by audioUrl, classifies into healthy /
    encrypted_with_progressive / encrypted_only / fetch_failed buckets.
  - `[SC-DIAG]` console logs in `CrosswordGrid1.svelte` and
    `SoundCloudManager.svelte` log `getCurrentSound()` metadata when a
    track gets marked unavailable.
- **Browser-compatibility modal** (`BrowserCompatibilityNotice.svelte`):
  shown on every page load to all users *except* confirmed iPhones.
  Conservative suppression — even Mac Safari and Firefox-on-Mac users see
  it, since they're informed correctly by the copy.

## Branches not on main

- `audio/progressive-fallback` — direct-stream workaround (server endpoint
  + client `<audio>` fallback). Recovers ~half the broken tracks. Not
  merged. Tradeoffs in the ToS section above.

## Strategic read

- Even if SoundCloud fixes the Widevine handshake (estimated ~40–50% in 6
  months, 70%+ in 18 months — pure guess), the *encryption rollout itself*
  will keep expanding, and `SUB_HIGH_TIER` tracks (Go+ subscription gate)
  won't play in anonymous embeds even with EME working. The ceiling on
  embedded SoundCloud playback is dropping over time, not just the floor.
- Durable fix is moving off SoundCloud as the audio source. Options
  considered: self-hosted licensed snippets on R2, YouTube IFrame Player,
  Spotify/Apple MusicKit previews. All have tradeoffs (cost, licensing,
  player UX); none are quick.

## Open questions

1. **What is SoundCloud's actual fix timeline?** — We have no public
   communication from them. The presence of the `ctr-encrypted-hls`
   variant is a signal they intend Chromium playback to work eventually,
   but no ETA.
2. **Does Firefox on Windows/Linux work?** — Firefox has its own Widevine
   integration via Cisco's CDM, so it might. Untested. Currently shown the
   modal as a conservative default.
3. **Does Android Chrome work?** — Anecdotally we haven't seen reports of
   failures, but we haven't probed. Same Chromium code path that breaks on
   desktop, but mobile may use a different SoundCloud player path.
4. **Does iPad work?** — iPadOS uses WebKit, so likely yes, but we haven't
   confirmed. Treated as "show the modal" for now since the user only
   confirmed iPhones.
5. **What % of the full catalog (366 puzzles) is affected?** — The audit
   endpoint can answer this; hasn't been run end-to-end at scale yet
   (full scan may need to be chunked by date range to avoid Cloudflare
   Pages timeout).
6. **What % of broken tracks have a progressive fallback (recoverable)
   vs encrypted-only (unrecoverable)?** — Audit endpoint will report this
   per-track when run.
7. **Will the progressive-fallback workaround actually play in
   production?** — Stream URLs may have IP-binding or other gotchas that
   only show up when the worker IP differs from the user IP. Unverified.
8. **Will SoundCloud's client_id stay scrape-able?** — They've rotated
   client_id endpoints multiple times historically. The audit + fallback
   code both depend on it; expect occasional maintenance.
9. **Are we comfortable with the ToS gray of the progressive-fallback
   approach?** — It bypasses SC's ad insertion on `MONETIZE` tracks. Risk
   to weigh: small chance of embed-API revocation, which would brick the
   *entire* catalog, not just the broken half.
10. **Does Crosstune have any contractual relationship with SoundCloud
    we could leverage for a faster fix?** — As far as the codebase shows,
    we use the public embed widget without a formal partnership.

## Useful diagnostic recipes

```bash
# Single track
curl 'https://crosstune.io/api/probe-track?url=https://soundcloud.com/oasisofficial/wonderwall-2'

# All tracks in today's puzzle
curl 'https://crosstune.io/api/probe-track?date=2026-04-29'

# Catalog-wide impact (chunk by quarter if it times out)
curl 'https://crosstune.io/api/audit-tracks?slim=true'
curl 'https://crosstune.io/api/audit-tracks?from=2025-04-29&to=2025-07-31'
```

The `transcodings` array returned per track is the key signal. Look for:
- `protocol: "cbc-encrypted-hls"` or `"ctr-encrypted-hls"` → broken in
  Chrome unless a `progressive` variant exists alongside.
- `protocol: "progressive"` with `snipped: false` → fully usable for the
  fallback workaround.
- `protocol: "progressive"` with `snipped: true` → 30-second snippet only;
  works for short puzzle clips that start near the beginning.
