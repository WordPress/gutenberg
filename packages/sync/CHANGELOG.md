<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   This package no longer ships any built-in sync engine or transport. `getDefaultEngineAdapters()` and `getDefaultTransports()` are now empty; an engine/transport plugin must register implementations — via the private `registerSyncEngine` / `registerSyncTransport` APIs or the `sync.engines` / `sync.transports` filters — for real-time collaboration to work. Without one, a session finds nothing to negotiate and the editor falls back to the exclusive post lock. The Yjs relay engine (including its Yjs-backed undo manager) and the HTTP short-poll / long-poll / WebSocket transports moved out of this package (into the Gutenberg Sync Engines plugin); the package keeps only the engine-neutral manager shell, the two registries with negotiation, the engine SPI, and its shared Yjs export (`wp.sync.Y`).
-   `resolveEngineAdapter()` and transport negotiation no longer fall back to the Yjs relay / HTTP polling when the server announces nothing. With no built-in to fall back to, a missing announcement resolves to no engine and declines to connect — the client/server handshake is now required.

### New Features

-   Add the engine SPI so a plugin can implement a sync engine and compose it with the generic manager: `SyncEngine` (a factory of per-entity/collection cores plus the session-scoped, sync-aware undo manager via `createUndoManager`) → `EngineEntity` / `EngineCollection` (which own the document model — local-change application, hydration, snapshot, undo scope, remote-change observation) → the existing `EngineSessionCodec` (transport-facing), all exported as public types. The private API adds `registerSyncEngine` / `registerSyncTransport` (imperative registration) and `getProviderCreators`, plus registry test-support helpers.

### Enhancements

-   Sync transports are now swappable. The client keeps a slug-keyed transport registry (filterable via `sync.transports`) and NEGOTIATES against the server's announced transport list — using the first announced slug it has registered whose protocol it implements — instead of assuming HTTP short-polling. Selection code is transport-agnostic; adding a transport is a sibling folder plus a registration.
-   Add an HTTP long-polling transport (`http-long-polling`): the shared polling manager pointed at a held-open server route with an immediate re-issue cadence, so remote edits arrive promptly without tight polling.
-   Add a WebSocket transport (`websocket`): a codec-driven push client (`providers/websocket/`) over a persistent socket served by a long-running PHP daemon (`WP_WebSocket_Sync_Server`, `wp collaboration sync-server`). Both the daemon and the REST transports drive rooms through the same `WP_Sync_Engine` seam, so engines stay swappable across transports.
-   `createSyncManager` is now engine-neutral: `createSyncManager( engine, { debug } )` composes an injected `SyncEngine` with a generic shell that owns negotiation, provider wiring, entity/collection lifecycle, and the deferred-update policy. Engine adapters compose it inside `createManager`; the manager no longer hardcodes Yjs (its entity AND collection paths delegate to the engine).
-   Connection retry is now transport-agnostic. `SyncManager.retry()` asks every live provider (via a new optional `ProviderCreatorResult.retry()`) to reconnect, and `retrySyncConnection` (now owned by `core-data`) drives it through the active manager — instead of reaching into the HTTP-polling singleton, which did nothing when a different transport was active.

### Bug Fixes

-   Classic (core/freeform) content now syncs through the intent-log engine: the server previously DROPPED comment-less classic runs from the shared document entirely, erasing them from every collaborator's editor. Genesis now carries them as `core/freeform` specs with a content field, materialize emits them bare (no comment delimiters), and the client hydrates them back to the raw `content` attribute via the new `SyncConfig.hydrateRawContent` hook.
-   Custom HTML blocks now sync through the intent-log engine. Their markup lives in `innerContent` fragments (not any attribute — the `content` attribute is deprecated), which the capture bridge ignored entirely. Raw-content blocks now sync their full inner HTML as the engine's `content` field through the rich-text codec (matching the server's genesis/materialize treatment of innerHTML), via new `SyncConfig.isRawContentBlock`/`serializeRawContent` hooks backed by the block serializer. Content edits ride `format_text` intents with object-format ids, so the `unfiltered_html` enforcement lane judges them like any other markup.
-   The intent-log capture bridge no longer authors `set_attr` intents for editor attributes that surface as explicitly `undefined` (a `role: "local"` normalization artifact — core/html `content`). Such a write is not expressible on the wire (`JSON.stringify` drops the key), and the resulting schema-invalid intent poisoned the whole batch: the server rejected it and the room's outbox wedged in a permanent retry loop, silently blocking ALL sync for blocks like Custom HTML. Undefined attrs now carry the document's current value through diffing and verification (absence is not testimony).

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))
-   Gate transport negotiation on the Real-Time Collaboration experiment flag `window.__experimentalEnableRealTimeCollaboration`, replacing the `window._wpCollaborationEnabled` option flag ([#80658](https://github.com/WordPress/gutenberg/pull/80658)).
-   Remove residue left behind by the engine/transport extraction: the debug inspector (`debug/inspector.ts`, an unreferenced byte-identical duplicate of the copy the Gutenberg Sync Engines plugin owns), six unused Yjs document-schema constants in `config.ts` (owned by the plugin's Yjs engine), the unused `AwarenessID` / `Origin` types, a redundant type re-export block, stale comments referencing the deleted `undo-manager.ts`, and the unused `lib0` / `@wordpress/api-fetch` dependencies.
-   Extract the Yjs relay engine logic out of the HTTP polling transport into an engine session codec (`src/engines/yjs-relay/`). Transport providers now receive an engine-generic session codec via `ProviderCreatorOptions.session` instead of `ydoc`/`awareness`, so transports no longer depend on Yjs. No wire-format or behavior change.
-   Session codecs stamp their engine identity (`engine` / `engine_protocol`) on every sync request so the server can fence a stale tab speaking the wrong engine before storing its updates, and the HTTP polling transport handles the server's 409 `rest_sync_engine_mismatch` by dropping the affected room into a disconnected state with the new `ENGINE_MISMATCH` connection error code instead of retrying.
-   `RecordHandlers` gains an optional `onEscalation` callback; the intent-log manager reports engine escalations through it (with local/remote attribution) instead of logging to the console.
-   `SyncReviewItem` gains `targetId` — the target block's engine identity (syncId) when the escalated intent addresses one — so editor UI can anchor conflicts to blocks in the canvas.
-   `SyncReviewItem` gains `proposedInsertion` for parked `insert_block` proposals: the proposed block type, its decoded content, and where it would land — so editor UI can render an inline approval card at that position (the block is not in the reviewer's canvas, so `targetId` cannot anchor it).
-   Restoring a parked `insert_block` proposal now re-inserts the block spec under fresh identities (with degraded anchors when the original position is gone) instead of silently resolving, and review summaries cover `insert_block` (block type + content, including raw-attr content like Custom HTML) and `format_text` — so reviewers see exactly what they would approve.
-   The intent-log engine gains an entity property family: document-level per-name registers (`set_property` intents) sync the post title between collaborators. Concurrent writes to the same property escalate (`property-conflict`); different properties and property-vs-block edits merge clean.
-   Transport error recovery is now codec-driven: engines whose updates are idempotent on the server (the intent log) get their exact updates restored and re-sent after an unknown-outcome request, while the Yjs codec keeps full-state recovery via a new optional `createRecoveryUpdate`. Previously the transport unconditionally cleared the queue and requested a compaction the intent-log codec throws on — one transient network error while typing lost the queued intents and permanently stopped polling.
-   The intent-log engine pins its text coordinate space to UTF-16 code units cross-language, escalates identity-addressed intents on merge-absorbed blocks instead of silently voiding them (`already-merged` voids the idempotent same-pair case), makes ingest idempotent for duplicates within a single batch, and rejects nested duplicate ids in inserted subtrees. The frozen vectors now include multibyte content, a hand-authored boundary-geometry case, and a JS-side replay test.
-   New opt-in sync wire inspector for debugging the polling stream from the browser console: `wpSync.enable()` then `wpSync.tail()` live-prints DECODED non-empty polls (intents as one-line summaries, never nested JSON strings), backed by a ring buffer with query helpers (`log`, `table`, `intents( syncId )` per-block history, `doc`/`proposals`/`cursor` session state, `export` for bug reports). When enabled, requests also ask the server for a `_debug` envelope (ingest lock wait, retained window size, plan outcome counts, checkpoint events; gated by `SCRIPT_DEBUG` or the `wp_sync_debug_enabled` filter), and the engine emits `qm/debug` breadcrumbs (checkpoints, trims, escalations, stale-base voids, lock timeouts) for Query Monitor users.
-   Parked escalations gained a full review lifecycle: sessions expose the open-proposal list (`getOpenProposals`/`onProposalsChange`) reconstructed entirely from retained rows, a new `resolved` wire row closes a proposal idempotently (server-stamped attribution), proposal rows carry review context (settlement seq, timestamp, target-field excerpt), the manager offers `resolveProposal`/`restoreProposal` (best-effort re-author of the lost content as ordinary edits), and compaction now drops resolved proposal pairs while retaining open ones indefinitely.
-   The intent-log capture layer moved from HTML-string diffing to RICH-TEXT coordinates: a vector-frozen codec (JS + PHP twin) converts inline HTML to plain text + format spans, text intents carry markup-free offsets, every registry-declared rich-text attribute becomes its own field, paragraph splits/merges derive as `split_block`/`merge_blocks`, and formatting changes derive as `format_text` — concurrent formatting and typing in one paragraph now merge cleanly instead of escalating or corrupting markup.
-   Intent-log growth is now bounded on both sides: the server appends periodic compaction checkpoints, serves late joiners and stale cursors from the latest retained checkpoint (a reset snapshot the session re-bootstraps from, with the manager re-deriving unsent work from the editor tree), trims history behind the previous checkpoint while preserving parked proposals, and answers pure read polls without reconstructing engine state; the client replica trims its observed log below what replanning can ever need.
-   Remove the vestigial `SyncEngineAdapter.createSessionCodec`. The engine's per-room core (`EngineEntity`/`EngineCollection`) owns the transport-facing session codec now (via `createSession()`), so the adapter field was dead.

## 1.53.0 (2026-08-12)

## 1.52.0 (2026-07-29)

## 1.51.0 (2026-07-14)

## 1.50.0 (2026-07-01)

## 1.49.0 (2026-06-24)

## 1.48.1 (2026-06-16)

## 1.48.0 (2026-06-10)

-   Prevent RTC polling interval filters from slowing active HTTP polling.

## 1.47.0 (2026-05-27)

## 1.46.0 (2026-05-14)

## 1.45.0 (2026-04-29)

## 1.44.0 (2026-04-15)

## 1.43.0 (2026-04-01)

## 1.42.0 (2026-03-18)

## 1.41.0 (2026-03-04)

## 1.40.0 (2026-02-18)

## 1.39.0 (2026-01-29)

## 1.38.0 (2026-01-16)

## 1.36.0 (2025-11-26)

## 1.35.0 (2025-11-12)

## 1.34.0 (2025-10-29)

## 1.33.0 (2025-10-17)

## 1.32.0 (2025-10-01)

## 1.31.0 (2025-09-17)

## 1.30.0 (2025-09-03)

## 1.29.0 (2025-08-20)

## 1.28.0 (2025-08-07)

## 1.27.0 (2025-07-23)

## 1.26.0 (2025-06-25)

## 1.25.0 (2025-06-04)

## 1.24.0 (2025-05-22)

## 1.23.0 (2025-05-07)

## 1.22.0 (2025-04-11)

## 1.21.0 (2025-03-27)

## 1.20.0 (2025-03-13)

## 1.19.0 (2025-02-28)

## 1.18.0 (2025-02-12)

## 1.17.0 (2025-01-29)

## 1.16.0 (2025-01-15)

## 1.15.0 (2025-01-02)

## 1.14.0 (2024-12-11)

## 1.13.0 (2024-11-27)

## 1.12.0 (2024-11-16)

## 1.11.0 (2024-10-30)

## 1.10.0 (2024-10-16)

## 1.9.0 (2024-10-03)

## 1.8.0 (2024-09-19)

## 1.7.0 (2024-09-05)

## 1.6.0 (2024-08-21)

## 1.5.0 (2024-08-07)

## 1.4.0 (2024-07-24)

## 1.3.0 (2024-07-10)

## 1.2.0 (2024-06-26)

## 1.1.0 (2024-06-15)

## 1.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 0.20.0 (2024-05-16)

## 0.19.0 (2024-05-02)

## 0.18.0 (2024-04-19)

## 0.17.0 (2024-04-03)

## 0.16.0 (2024-03-21)

## 0.15.0 (2024-03-06)

## 0.14.0 (2024-02-21)

## 0.13.0 (2024-02-09)

## 0.12.0 (2024-01-24)

## 0.11.0 (2024-01-10)

## 0.10.0 (2023-12-13)

## 0.9.0 (2023-11-29)

## 0.8.0 (2023-11-16)

## 0.7.0 (2023-11-02)

## 0.6.0 (2023-10-18)

## 0.5.0 (2023-10-05)

## 0.4.0 (2023-09-20)

## 0.3.0 (2023-08-31)

## 0.2.0 (2023-08-16)
