# Real-time collaboration

The `sync` package provides the syncing layer for real-time collaboration. Each entity with sync enabled is represented by a CRDT ([Yjs](https://docs.yjs.dev/)) document. Local edits to an entity are applied to its CRDT document, which is synced with other peers via a provider. Those peers extract changes from the CRDT document and apply them to their local state.

Relevant docs and discussions:

-   https://make.wordpress.org/core/2023/07/13/real-time-collaboration-architecture/
-   https://github.com/WordPress/gutenberg/issues/52593
-   https://github.com/WordPress/gutenberg/discussions/65012

## Key concepts

-   **CRDT document**: A [Yjs `Y.Doc`](https://docs.yjs.dev/api/y.doc) that holds synced entity data. CRDTs (Conflict-free Replicated Data Types) allow concurrent edits from multiple peers to be merged automatically without conflicts.
-   **Sync manager**: Orchestrates the lifecycle of synced entities: creating CRDT documents, connecting providers, attaching observers, and coordinating updates.
-   **Provider**: A transport layer that syncs CRDT document updates between peers. The default provider uses HTTP polling; plugins can substitute their own provider via the `sync.providers` filter.
-   **Awareness**: Ephemeral presence state (e.g., cursor positions, user identity) shared between peers. Unlike CRDT document state, awareness is not persisted.
-   **Sync config**: An entity-level configuration object that defines how local changes are written to the CRDT document and how remote changes are extracted from it. See the `SyncConfig` type in `src/types.ts`.
-   **Origin**: A value attached to each Yjs transaction to identify the source of a change (e.g., local editor, sync manager, undo manager, or remote peer). Origins are used to decide which changes should trigger store updates and which should be tracked by the undo manager.

## CRDT document structure

Each synced entity gets its own `Y.Doc` with two root-level `Y.Map` entries:

| Key        | Constant              | Purpose                                                                                                                                                                                |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document` | `CRDT_RECORD_MAP_KEY` | Holds the entity record data (the synced properties).                                                                                                                                  |
| `state`    | `CRDT_STATE_MAP_KEY`  | Metadata about the CRDT document and the entity: a schema version number (`version`), the timestamp of the last save (`savedAt`), and the client ID of the peer who saved (`savedBy`). |

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

## Providers

A provider is a transport layer that syncs Yjs document updates between peers. This package uses a pluggable provider system defined in `src/providers/`.

### Default: HTTP polling

The default provider (`src/providers/http-polling/`) uses HTTP polling to exchange updates with a central sync server. A shared polling manager batches updates for all rooms (entities) into a single request per poll cycle. See [the HTTP polling README](./src/providers/http-polling/README.md) for full details including the REST API format, sync protocol, and compaction.

-   Poll interval: 1 second when editing alone, 250ms when collaborators are detected.
-   On errors, the interval backs off exponentially (up to 30 seconds).
-   Awareness state is sent and received alongside document updates in the same poll request.

### Custom providers

Plugins can replace or augment the default provider using the `sync.providers` WordPress filter hook. The filter receives an array of `ProviderCreator` functions and should return the same. Each `ProviderCreator` is an async function that receives `{ objectType, objectId, ydoc, awareness? }` and returns `{ destroy, on }`. The `on` method is used by the sync manager to listen for provider status events (e.g., connection state changes).

```js
import { addFilter } from '@wordpress/hooks';
import { Y } from '@wordpress/sync';

addFilter( 'sync.providers', 'my-plugin/websocket-provider', ( providers ) => {
	// Replace the default HTTP polling provider with a WebSocket provider.
	return [
		async ( { objectType, objectId, ydoc, awareness } ) => {
			const ws = new WebSocketProvider(
				ydoc,
				objectType,
				objectId,
				awareness
			);

			return {
				destroy: () => ws.disconnect(),
				on: ( event, callback ) =>
					ws.addEventListener( event, callback ),
			};
		},
	];
} );
```

## Persistence

CRDT documents can be persisted so that a user returning to an entity can restore its CRDT state (including the full edit history needed for proper merging). See `src/utils.ts` for serialization helpers.

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

The `SyncUndoManager` (`src/undo-manager.ts`) replaces the default WordPress undo manager when synced entities are in use. It wraps Yjs's built-in undo functionality.

-   **Lazy creation**: The undo manager is created when the first entity is loaded. If no entities are synced, the default WordPress undo manager is used.
-   **Automatic tracking**: Unlike the default undo manager, which explicitly records each edit, the `SyncUndoManager` relies on Yjs to track changes to observed `Y.Map` instances. Only changes with the local editor origin are tracked.
-   **Capture grouping**: Changes within 500ms of each other are grouped into a single undo step, preventing mid-word undo breaks.
-   **Limitation**: Once created, the `SyncUndoManager` only tracks synced entities. Edits to non-synced entities are not included in the undo stack.
