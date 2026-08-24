# Real-time collaboration

The `sync` package is the **engine-neutral substrate** for real-time collaboration: a generic sync-manager _shell_, two registries (engines and transports) with a client/server handshake, and the engine SPI that a collaboration engine implements. It ships **no engine and no transport** of its own — both live in a separate plugin (the Gutenberg Sync Engines plugin) and register through this package's unlockable private APIs (`registerSyncEngine` / `registerSyncTransport`) and the `sync.engines` / `sync.transports` / `sync.providers` filters. Without such a plugin, the registries are empty and collaboration degrades to the classic post lock.

> **Note (post-split, 2026-08-10).** Much of the detail below — CRDT (`Y.Doc`) documents, HTTP polling, `Y.Doc` persistence, Yjs undo — describes the behavior of the built-in **yjs-relay** engine, which (with the transports) has moved into the plugin. The framework now only defines the seams they plug into. The generic manager (`createSyncManager( engine, { debug } )`) delegates all document meaning to an injected `SyncEngine` (see `src/engines/engine.ts`), including undo (`SyncEngine.createUndoManager`). This package no longer contains any engine or transport implementation — its only remaining Yjs references are the deliberate shared `Y` export and a couple of Yjs-typed contract types (`CRDTDoc`, `SyncUndoManager.addToScope`). For the full picture see `prototypes/sync/ARCHITECTURE.md`.

Relevant docs and discussions:

-   https://make.wordpress.org/core/2023/07/13/real-time-collaboration-architecture/
-   https://github.com/WordPress/gutenberg/issues/52593
-   https://github.com/WordPress/gutenberg/discussions/65012

## Key concepts

-   **CRDT document**: A [Yjs `Y.Doc`](https://docs.yjs.dev/api/y.doc) that holds synced entity data. CRDTs (Conflict-free Replicated Data Types) allow concurrent edits from multiple peers to be merged automatically without conflicts.
-   **Sync manager**: The engine-neutral shell that orchestrates the lifecycle of synced entities — negotiating a transport, wiring the engine's session codec to it, coordinating the deferred-update policy, and connecting to `core-data`. It delegates all document meaning to the injected engine.
-   **Engine**: Owns the _meaning_ of sync (how local edits become updates and received updates become entity changes). A plugin implements the `SyncEngine` SPI — `SyncEngine` → `EngineEntity` / `EngineCollection` → `EngineSessionCodec` (`src/engines/engine.ts`, `src/engines/session.ts`) — and composes it with `createSyncManager` in a `SyncEngineAdapter`.
-   **Transport (provider)**: Moves engine updates between peers. The framework ships none; a plugin registers transports via `registerSyncTransport` / the `sync.transports` filter, and the active one is negotiated against the server announcement.
-   **Awareness**: Ephemeral presence state (e.g., cursor positions, user identity) shared between peers. Unlike CRDT document state, awareness is not persisted.
-   **Sync config**: An entity-level configuration object that defines how local changes are written to the CRDT document and how remote changes are extracted from it. See the `SyncConfig` type in `src/types.ts`.
-   **Origin**: A value attached to each Yjs transaction to identify the source of a change (e.g., local editor, sync manager, undo manager, or remote peer). Origins are used to decide which changes should trigger store updates and which should be tracked by the undo manager.

## CRDT document structure

Each synced entity gets its own `Y.Doc` with two root-level `Y.Map` entries:

| Key        | Constant              | Purpose                                                                                                                                                                                                                                       |
| ---------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document` | `CRDT_RECORD_MAP_KEY` | Holds the entity record data (the synced properties).                                                                                                                                                                                         |
| `state`    | `CRDT_STATE_MAP_KEY`  | Metadata about the CRDT document and the entity: a schema version number (`version`) and the last user-facing entity save (`savedAt`/`savedBy`). Peers refetch records on `savedAt`; collaborator save notifications use `savedAt`/`savedBy`. |

These constants are defined in `src/config.ts`.

## Sync manager

The sync manager (`src/manager.ts`) orchestrates the lifecycle of synced entities. Its public API:

-   **`load(syncConfig, objectType, objectId, record, handlers)`**: Initialize an entity for syncing. Creates a `Y.Doc`, connects providers, attaches deep observers, restores any persisted CRDT document, and registers the entity with the undo manager.
-   **`loadCollection(syncConfig, objectType, handlers)`**: Initialize a collection (e.g., an entity type's list view) for syncing. Used to detect when a peer saves a record so the collection can be refetched.
-   **`update(objectType, objectId, changes, origin, options)`**: Apply local changes to the entity's CRDT document. The sync config's `applyChangesToCRDTDoc` is called inside a Yjs transaction.
-   **`unload(objectType, objectId)`**: Disconnect providers, remove observers, and destroy the `Y.Doc`.
-   **`getAwareness(objectType, objectId)`**: Return the awareness instance for the entity, if one exists.
-   **`createPersistedCRDTDoc(objectType, objectId)`**: Serialize the entity's CRDT document for persistence (see "Persistence" below).
-   **`undoManager`**: The sync-aware undo manager, lazily created when the first entity is loaded (see "Undo / redo" below).

### Data flow

1.  **Local changes**: When the entity record is edited or changed locally, the consumer must call `syncManager.update()` with the changed record. The sync config's `applyChangesToCRDTDoc` updates the CRDT document. The provider observes these updates and sends them to peers.
2.  **Remote changes**: When the provider receives remote updates, it applies them to the local `Y.Doc`. An observer detects non-local changes and calls `syncConfig.getChangesFromCRDTDoc` to extract the changed properties, which are then written to the local store via `handlers.editRecord`.

### Sync config

The sync config (`SyncConfig` in `src/types.ts`) is an entity-level object that controls what gets synced and how:

-   **`applyChangesToCRDTDoc(ydoc, changes)`**: Write local changes into the CRDT document.
-   **`getChangesFromCRDTDoc(ydoc, editedRecord)`**: Compare the CRDT document against the current entity record and return the properties that differ.
-   **`createAwareness(ydoc, objectId)`** _(optional)_: Create an `Awareness` instance for collaborative presence.
-   **`getPersistedCRDTDoc(record)`** _(optional)_: Extract a serialized CRDT document from the entity record for restoration on load (see "Persistence" below).

The sync config "owns" the sync behavior of the entity; it has sole knowledge of the entity schema and edit flows. The sync config is defined and controlled by the `core-data` package.

## Transports (providers)

A transport (provider) moves engine updates between peers. This package defines the transport **registry and negotiation** (`src/providers/index.ts`) but ships **no built-in transport** — they live in a plugin. The server announces the transports it supports (active-first); the client picks the first announced slug it has registered whose protocol matches, else it declines to connect (post lock).

### Registering a transport

A plugin registers a transport with `registerSyncTransport( { slug, protocolVersion, create } )` (via the unlocked private API) or by appending to the `sync.transports` filter. `create()` returns a `ProviderCreator`: an async function that receives `{ objectType, objectId, session }` — where `session` is the engine's `EngineSessionCodec`, so transports never see engine internals like a `Y.Doc` — and returns a `ProviderCreatorResult`:

-   **`on( event, callback )`**: the manager subscribes to `status` (connection state).
-   **`destroy()`**: tear down the connection.
-   **`retry?()`** _(optional)_: reconnect / poll immediately. The manager's transport-agnostic `retry()` calls this on every live provider (wired to the editor's connection-error UI via `core-data`'s `retrySyncConnection`).

```js
import { addFilter } from '@wordpress/hooks';

addFilter( 'sync.transports', 'my-plugin/websocket', ( transports ) => [
	...transports,
	{
		slug: 'websocket',
		protocolVersion: 1,
		create: () => async ( { objectType, objectId, session } ) => {
			const ws = new MyWebSocketProvider( objectType, objectId, session );
			return {
				on: ( event, cb ) => ws.addEventListener( event, cb ),
				destroy: () => ws.disconnect(),
				retry: () => ws.reconnect(),
			};
		},
	},
] );
```

The built-in `http-polling` / `http-long-polling` / `websocket` transports now live in the Gutenberg Sync Engines plugin (`src/providers/`, one folder each); the polling manager, intervals (4 s alone / 1 s with collaborators), backoff, and REST format are documented there. Tests and the `sync.providers` filter (which replaces the negotiated provider list outright — used mainly for testing) remain in this package.

## Persistence

CRDT documents can be persisted so that a user returning to an entity can restore its CRDT state (including the full edit history needed for proper merging). This is the built-in Yjs engine's behavior; its serialization helpers now live in the plugin (`src/engines/yjs-relay/doc.ts`). The manager exposes it engine-neutrally through `EngineEntity.serialize()` / `hydrate()`.

-   **Initialization problem**: Persisting CRDT documents establishes a shared starting point for all peers. This is critical to prevent data loss and ensure proper merging of concurrent edits.
-   **Serialization**: The sync manager's `createPersistedCRDTDoc` method returns a serialized `Y.Doc`. The consumer is responsible for storing this string.
-   **Restoration**: On `load`, if the entity's sync config provides `getPersistedCRDTDoc`, the sync manager calls it to retrieve the serialized CRDT document.
-   **Invalidation**: After restoring, the sync manager compares the CRDT document against the current entity record (via `getChangesFromCRDTDoc`). If they differ (e.g., the server mutated the entity on save, or an out-of-band update occurred), the differences are applied to the CRDT document and a save is triggered to re-persist it.

Persistence is opt-in per entity type via `syncConfig.getPersistedCRDTDoc`.

## Awareness

Awareness provides ephemeral presence information (cursor positions, user identity, etc.) that can be used to enhance the collaborative experience. Awareness state is shared between peers but not persisted.

-   An entity's sync config can optionally create an `Awareness` instance via `createAwareness(ydoc, objectId)`.
-   The awareness instance is passed to providers, which transport awareness state alongside document updates.
-   Consumers can call `syncManager.getAwareness(objectType, objectId)` to access the awareness instance for a given entity.

## Undo / redo

Undo is **engine-provided**. The generic manager asks the injected engine for a session-scoped, sync-aware undo manager (`SyncEngine.createUndoManager()`), exposes it as `SyncManager.undoManager` — replacing the default WordPress undo manager while synced entities are loaded — and registers each entity with it (`EngineEntity.addToUndoScope`). An engine without collaborative undo leaves it undefined. This package keeps only the `SyncUndoManager` **type** (the WordPress-undo-manager contract core-data consumes).

Collaborative undo is engine-specific by nature — it must undo only the local client's changes and rebase them over concurrent remote edits, which depends on the merge model — so each engine implements its own:

-   **Yjs relay** (in the plugin): wraps Yjs's undo (`YMultiDocUndoManager`) — Yjs tracks changes to observed `Y.Map`s per entity, gives each peer its own stack, groups edits within 500ms, and tracks only local-origin changes.
-   **Intent-log** (planned): inverse intents — invert the user's own local intents and re-author them, letting the server rebase like any intent (see `prototypes/sync/ARCHITECTURE.md` → _Open items / TODOs_). It currently leaves undo undefined.
