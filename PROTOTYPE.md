# Collaborative editing prototype (arch-decision branch)

A stitched, working prototype of the decision-proof foundations from the
"Problems and strategies" plan — tasks 1, 2, 4, and 5. It combines the
existing worktree experiments onto one branch and adds the integration glue
none of them had. Strategy 2 (server understands updates) and strategy 3
(intent capture) are deliberately absent: they are the benchmark's subject,
not stitchable code.

## What's here, per task

**Task 1 — stable block identity** (`lib/experimental/distributed-editing/sync-id.js`, new)
An editor-store subscriber fills `metadata.syncId` for blocks that lack one
and re-mints when a duplicate ID appears (block duplication copies `metadata`
wholesale). IDs ride the block comment delimiter, so they persist with
content and are visible to the server. **Deviation from the spec:** random
minting only. Deterministic genesis minting (pure function of a saved
revision) is specified with frozen cross-language vectors in the sync
prototype (`prototypes/sync/` on `chriszarate/investigate-rtc-arch`), but
needs revision plumbing and the PHP hash twin; additionally, the spec's
server-side repair mechanic is unimplementable as written (it mints against a
revision that does not yet exist at `wp_insert_post_data` time) and must be
redesigned before any server-side identity work.

**Task 2 — review lane** (`lib/experimental/distributed-editing/`, from `chriszarate/arch-exploration`)
The sequestration engine: base-version CAS, chunk-level kses/approval
invariant, `de/pending-review` void block, byte-pinned approval,
modify-then-approve, in-canvas review UI. Changes made during the stitch:

- **Re-keyed to syncId.** Chunk alignment now pairs by `metadata.syncId`
  first (a moved, byte-identical block passes through; an identity-paired
  edit is not miscounted as a protected deletion), with the original
  byte-exact LCS as fallback for id-less legacy chunks. Two new PHPUnit
  tests cover the move and edited-pair cases.
- **Auto-approval is disabled whenever a collaboration transport is active**
  (`isLiveSessionActive()` checks `window._wpCollaborationTransport`). With a
  live channel, the client cannot distinguish its user's chunks from a
  peer's, and automatic approval would bless bytes the approver never saw —
  the content-laundering hole. Until server-verified provenance exists,
  in-session protected changes sequester for explicit review.
- **Sandboxed preview restored** in the review UI (SandBox behind a toggle),
  so reviewers aren't judging raw HTML in a textarea.

**Task 4 — relay through WordPress with actor stamping** (`lib/experimental/collaboration/`, `packages/sync/`, from `chriszarate/try-php-transports`)
The transport-agnostic `WP_Sync_Server_Core` plus long-polling and PHP
WebSocket transports and their client providers. Stitch additions:

- `add_update()` stamps the authenticated user (`actor`) on every stored
  update at ingest. Payloads remain opaque — this is update-level
  attribution, the substrate content-level attribution needs, not a
  replacement for it.
- The core remains Yjs-protocol-shaped (`sync_step1`/`sync_step2`/
  `compaction`). That is acceptable for the "naïve relay" phase and gets
  replaced by whatever engine the benchmark selects.

**Task 5 — base-version guard, session-aware** (spans both modules)
`WP_Sync_Server_Core::process_room_request()` now broadcasts the persisted
base-version token (`v1:` + sha256 of `post_content`, matching the DE
engine's format) with every sync response for post rooms. The polling
manager relays it as a `wp-sync-base-version` window event; the DE save
middleware adopts it. Result: a caught-up session participant always saves
with the current token (no false stale-base conflicts after a peer's save),
while a drifted client — offline through a save, or saving before catch-up —
is fenced with a 409 and a surfaced conflict. Out-of-session writers are
fenced by the existing CAS against the version they loaded.

## Merge-reconciliation note

Trunk removed the `onSync` callback from the http-polling chain after the
transports branch forked (autosave notices now use a timeout). The stitched
polling manager follows trunk's semantics; the long-polling and WebSocket
providers keep their self-contained `onSync` plumbing via the shared
protocol helper.

## Verification status (honest ledger)

- `packages/sync` jest: **256/256 pass** (includes both new transport suites
  and the reconciled polling manager).
- `php -l` on every touched PHP file: clean. `node --check` on both
  build-free scripts: clean.
- PHPUnit (including the two new engine tests): **written but not executed
  here** — wp-env was not started in this worktree. Run
  `npm run wp-env start -- --auto-port` and the phpunit suite before
  trusting the engine changes.
- e2e (DE spec, transport specs): **not executed here**; both suites passed
  in their donor worktrees before the stitch.
- `tsc -p packages/sync` standalone: fails on cross-package type resolution
  in this fresh worktree (dependency `.d.ts` not built) — pre-existing
  environment condition, not introduced by these changes.
- Package CHANGELOGs deliberately not updated: nothing here targets trunk
  yet; changelog entries come when something graduates.

## Demo script

1. `npm run wp-env start -- --auto-port`, enable the Gutenberg plugin.
2. Open a post as an admin and an incognito author (two sessions,
   collaboration on). Author inserts a Custom HTML block with a `<script>`
   tag; admin fixes a typo and saves → the script block **sequesters into a
   pending-review block** instead of laundering through the admin's save
   (auto-approval is off in-session). Admin reviews with the sandboxed
   preview and approves; the exact bytes persist.
3. While the session is live, update the post via WP-CLI/REST from outside
   → the next in-session save carries a stale token and 409s with a
   surfaced conflict instead of clobbering (and vice versa: the session's
   saves bump the token, which reaches participants on the next poll).
4. Move a block containing the admin-approved markup as the author →
   passes through byte-identical (identity matching), no re-sequester.

## Known limits

- Random-only ID minting: two clients that both open a never-saved legacy
  post mint different IDs until the first save wins.
- Base-version broadcast is poll-granularity; a save landing between polls
  can still produce one legitimate 409 that resolves on retry after the
  next poll.
- Stale-base recovery in a session is stop-and-surface; clean rebase over
  out-of-band writes is strategy 2's job.
- The `actor` stamp is not yet surfaced anywhere in UI; it is stored with
  each update row for the future engine.
