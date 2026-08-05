# Swappable sync architecture — integration plan

Status: planning note (2026-08-05). Companion to `SPEC.md` (engine) and
`INTEGRATION.md` (capture/Redux analysis). Target: the intent-log engine
fully integrated into WordPress + Gutenberg, under these constraints:

1. Engines swappable (intent-log ↔ Automerge ↔ Yjs relay) — a class swap
   server-side, a config change client-side.
2. Transports supremely swappable (short-poll → long-poll → WebSocket).
3. Engine/transport mismatch between server and client is detected and
   degrades to a post lock, never to corruption.
4. No Yjs/deprecated code removed yet; mark `@deprecated` only where it
   aids clarity.
5. Short-polling transport first.

## Current surface (trunk, this branch)

Server — `lib/experimental/collaboration/`:

- `WP_HTTP_Polling_Sync_Server`: REST short-poll route; conflates transport
  mechanics (rooms, cursors, auth, awareness) with engine semantics
  (update type enum `sync_step1`/`sync_step2`/`compaction`, compactor
  election).
- `WP_Sync_Config`: room grammar + capability checks. Engine-agnostic.
- `WP_Sync_Storage` interface + `WP_Sync_Post_Meta_Storage`. Engine-agnostic
  rows of `{ type, data, actor }`.
- `WP_Sync_Save_Server`: persists the materialized CRDT doc
  (`_crdt_document` meta).

Client:

- `packages/sync`: `SyncManager` (Yjs-coupled: creates Y.Docs, awareness,
  Yjs undo manager), transport providers behind `ProviderCreator` with a
  `sync.providers` filter — the transport seam ALREADY exists.
- `packages/core-data/src/utils/crdt*`: the entity bridge
  (`applyPostChangesToCRDTDoc` / `getPostChangesFromCRDTDoc`, positional
  block diff, rich-text delta merge).
- Gate: `wp_collaboration_enabled` option → `window._wpCollaborationEnabled`.

## Three-plane model

```
┌────────────────────────────────────────────────────────────┐
│ BRIDGE (editor/entity integration)                         │
│   capture local changes → engine; engine → entity updates  │
│   engine-specific adapters behind one interface            │
├────────────────────────────────────────────────────────────┤
│ ENGINE (merge semantics)                                   │
│   interprets update payloads; dispositions; materialization│
│   intent-log │ yjs-relay │ automerge …                     │
├────────────────────────────────────────────────────────────┤
│ TRANSPORT (movement)                                       │
│   rooms, cursors, auth, awareness, connection status       │
│   payload-opaque │ short-poll │ long-poll │ websocket …    │
└────────────────────────────────────────────────────────────┘
```

The transport moves envelopes and never interprets `data`:

```
{ room, engine: 'intent-log', engineProtocol: 1,
  kind: 'update' | 'awareness' | 'control', data: <opaque> }
```

The existing storage `type` enum values remain valid (they become the
yjs-relay engine's update kinds); new engines use their own kinds. Each
room's storage is stamped with the engine that owns it.

## Server seams (PHP)

```php
interface WP_Sync_Engine {
	public function get_slug();             // 'intent-log' | 'yjs-relay' | …
	public function get_protocol_version(); // int; bump on breaking change

	// Ingest one client's batch; returns per-update dispositions
	// (intent-log: applied/escalated/voided; yjs-relay: trivially stored).
	public function handle_updates( $room, $actor_id, $updates, $storage );

	// Entries since cursor, in server order, plus new cursor.
	public function get_updates_since( $room, $cursor, $storage );

	// Serialized post_content for persistence/save (null = not supported).
	public function materialize( $room, $storage );

	// Genesis payload for a joining client (intent-log: doc snapshot +
	// seq; yjs-relay: nothing — updates carry the state).
	public function bootstrap( $room, $post );

	// Engine-owned compaction/snapshot policy hook.
	public function maybe_compact( $room, $storage );
}
```

- `WP_Sync_Engine_Registry` + filters: `wp_sync_engines` (register),
  `wp_sync_engine_for_room` (select; site-wide default via option, per
  room-kind override). **Engine swap = registering/selecting a different
  class.** Constraint 1, server side.
- `WP_Yjs_Relay_Engine`: pure code motion — the current opaque-update
  storage, sync_step1/2 semantics, and compactor election move out of the
  polling server into this class. Nothing is deleted; the Yjs path becomes
  the seam's first implementation and stays runnable for benchmarking.
- `WP_Intent_Log_Engine`: the PHP twin of `planBatch` (prototype
  `src/rebase.js`) + reducer + document model. `handle_updates` = plan and
  commit, returning dispositions; `get_updates_since` = log slice;
  `materialize` = replay → block serialization; `maybe_compact` = snapshot
  at seq + trim below all-client cursor floor.
- `WP_HTTP_Polling_Sync_Server` becomes transport-only: auth (via
  `WP_Sync_Config`, unchanged), room parsing, cursor bookkeeping, awareness,
  and delegation to the room's engine. Long-poll and WebSocket transports
  (already prototyped on `arch-decision`) later reuse the same delegation —
  constraint 2, server side.

Storage: keep `WP_Sync_Storage`. Rows gain an engine stamp; the first write
to a room fixes its engine lineage. `WP_Sync_Save_Server` generalizes to
"engine document persistence" (`_crdt_document` stays for yjs; intent-log
persists `_intent_log_snapshot` + seq).

## Client seams (TS)

Two independent, filterable registries:

1. **Transports** — exists today (`sync.providers` filter,
   `ProviderCreator`). Short-poll = current http-polling provider.
   One required change: providers currently receive Yjs objects
   (Y.Doc/Awareness) — the interface narrows to envelopes in/out +
   connection status, so transports stop knowing the engine. This is the
   one real client-side untangling job.
2. **Engine adapters** — new:

```ts
interface SyncEngineAdapter {
	slug: string;
	protocolVersion: number;
	createSession( opts: {
		room: RoomId;
		bootstrap: unknown;   // engine-specific, from server handshake
		actorId: string;
	} ): EngineSession;
}

interface EngineSession {
	// Bridge side (core-data):
	applyLocalChanges( record: EntityChanges, cursorHint?: CursorHint ): void;
	onRemoteChanges( cb: ( record: EntityChanges ) => void ): void;
	// Transport side:
	outgoingUpdates(): Envelope[];             // drained on each poll
	receiveUpdates( entries: Envelope[], dispositions?: Disposition[] ): void;
	// Awareness passthrough; teardown.
	getAwareness(): unknown;
	destroy(): void;
}
```

- `yjs` adapter: wraps today's `SyncManager` + `crdt*` bridge — code
  motion, not rewrite. Direct call sites that bypass the adapter get
  `@deprecated` notes pointing at it (constraint 4).
- `intent-log` adapter: capture (INTEGRATION.md phase 1 —
  selection-anchored rich-text diff with verify-and-degrade, structure
  from tree diff keyed by syncId) + the prototype's client replica
  (`planBatch` over a local log copy) + remote apply via targeted entity
  updates. Undo: the Yjs undo manager does not apply; intent-log rides
  core's default undo initially (open item).
- **The client never chooses the engine.** The server announces it; the
  client looks the slug up in its registry. Engine swap = the server
  config change, client follows — constraint 1, client side.

## Handshake and mismatch → post lock (constraint 3)

Two enforcement levels; both fall back to the SAME degraded path.

1. **Bootstrap**: editor settings (preloaded) carry, per room-kind:
   `{ engine, engineProtocol, transports: ['short-poll'], transportProtocol }`.
   The client checks its registries. Missing engine slug, incompatible
   protocol version, or no mutually supported transport → the client does
   not join the room and instead falls back to **WordPress native post
   locking** (the classic heartbeat single-writer lock that collaboration
   currently supersedes), with a notice ("Live collaboration unavailable —
   editing with an exclusive lock"). No sync traffic is sent at all.
2. **Per-request**: every sync request stamps `engine` + `engineProtocol`
   per room. The server rejects on mismatch with `409
   sync_engine_mismatch` — checked against BOTH current server config and
   the room's storage lineage (a room whose rows are stamped `yjs-relay`
   rejects `intent-log` writes even if the site default changed
   mid-session; no cross-engine corruption, ever). A client receiving the
   409 tears down its session and enters the same lock fallback as (1).
   This covers stale tabs across a server-side engine swap: the stale tab
   drops to the lock path, and heartbeat lock arbitration resolves who
   edits — the already-shipped conflict UX.

Precedent to generalize: `CRDT_DOC_VERSION` in `packages/sync/src/config.ts`
becomes the yjs adapter's `protocolVersion`.

## Short-poll fit (constraint 5)

The existing poll shape (request: rooms + cursors + pending updates;
response: entries since cursor + awareness) fits the intent log with one
addition: a `dispositions` array in the response for the batch just
ingested (`{ intentId, status, reason? }`). The yjs-relay engine returns an
empty array. Cursor = log seq for intent-log; the client's `baseSeq` rides
inside intent payloads, not the transport.

## What deliberately does not change

- `WP_Sync_Config` room grammar + capability model (engine-agnostic,
  57-test coverage).
- Awareness (engine-agnostic; intent-log uses it for presence/selection).
- `wp_collaboration_enabled` gating; post locking machinery.
- All `crdt*` code and the Yjs stack — wrapped, not removed.

## Phasing

- **Phase 0 — extract seams, zero behavior change.** Server: engine
  interface + registry + `WP_Yjs_Relay_Engine` (code motion) + engine
  stamp on rooms + handshake settings + 409 path. Client: adapter
  interface + `yjs` adapter wrapping SyncManager; providers narrowed to
  envelopes. Gate: every existing PHPUnit/jest/e2e suite stays green with
  the yjs engine selected.

  **Status (2026-08-05): LANDED except provider narrowing.**
  - Server: `interface-wp-sync-engine.php`, `class-wp-sync-engine-registry.php`
    (`wp_sync_engines` / `wp_sync_engine_for_room` filters + `wp_sync_engine`
    option), `class-wp-yjs-relay-engine.php` (code motion incl. compaction
    election); polling server is transport-only and delegates; optional
    `engine`/`engine_protocol` request args → 409
    `rest_sync_engine_mismatch`; room lineage stamped on first write
    (oldest-row-wins, cache-hygienic direct DB), cross-engine writes
    rejected; handshake announced via `window._wpCollaborationSync`.
    PHPUnit: 176 pre-existing green + 11 new
    (`wpSyncEngineRegistry.php`).
  - Client: `packages/sync/src/engines.ts` (`SyncEngineAdapter`,
    `sync.engines` filter, `resolveEngineAdapter()` honoring the
    announcement with pre-handshake fallback to yjs-relay);
    `core-data/sync.ts#getSyncManager()` returns undefined on mismatch
    (post-lock posture) and warns once; transport handshake gates
    `getProviderCreators()`; `createSyncManager` marked `@deprecated` in
    private APIs in favor of the resolver. Jest: 247 sync + 885 core-data
    green.
  - Deferred from Phase 0: narrowing `ProviderCreatorOptions` to
    envelopes (transports still receive Y.Doc/Awareness) — scheduled with
    Phase 1 since the intent-log transport payloads force it anyway; and
    a visible editor notice on mismatch (currently console warning +
    no-join; the notice belongs with the Phase 2 UX pass).
- **Phase 1 — intent-log core lands.** JS engine core moves from
  `prototypes/sync/src` to a dependency-free home (proposal:
  `packages/sync/src/engines/intent-log/`, no Yjs imports); PHP planner
  twin (`planBatch` port) validated against the frozen `test-vectors/` and
  ported matrix/scenario suites. No editor wiring yet.
- **Phase 2 — intent-log end to end.** Capture v1 in the bridge, server
  engine behind the filter, dispositions in the poll response, escalations
  surfaced minimally (notice + console; proposal-lane UI comes from the
  review-lane work, later). **The swap test: flip a site between
  `yjs-relay` and `intent-log` via the filter, both ways, mid-content-
  lifetime — mismatched tabs must land in the lock fallback, never
  corrupt.** This is where constraints 1–3 get their proof.
- **Phase 3 — benchmark through the seam.** Point the cost/quality harness
  (refreshed-de-rtc) at `WP_Sync_Engine` so engines are compared
  head-to-head over identical transports and fixtures — the seam is what
  makes the benchmark's "swap if needed" outcome cheap, which is the point
  of constraint 1.

## Open items

- Provider interface narrowing (removing Y.Doc from `ProviderCreatorOptions`)
  is the riskiest refactor in Phase 0; needs its own regression pass over
  the http-polling provider tests.
- Undo for the intent-log adapter (Yjs undo manager is engine-specific).
- Multi-tab same-user (the prototype assumes one session per actor;
  actorId probably becomes user+session scoped before Phase 2).
- Where the JS engine core finally lives (`packages/sync/src/engines/…`
  vs its own package) — decide at Phase 1 by whether anything outside
  `packages/sync` needs to import it.
