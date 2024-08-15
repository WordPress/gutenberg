# Status of the sync experiment in Gutenberg

The sync package is part of an ongoing research effort to lay the groundwork of Real-Time Collaboration in Gutenberg.

Relevant docs:

- https://make.wordpress.org/core/2023/07/13/real-time-collaboration-architecture/
- https://github.com/WordPress/gutenberg/issues/52593
- https://docs.yjs.dev/

## Enable the experiment

The experiment can be enabled in the "Guteberg > Experiments" page. When it is enabled (search for `gutenberg-sync-collaboration` in the codebase), the client receives two new pieces of data:

- `window.__experimentalEnableSync`: boolean. Used by the `core-data` package to determine whether to bootstrap and use the sync provider offered by the `sync` package.
- `window.__experimentalCollaborativeEditingSecret`: string. A secret used by the `sync` package to create a secure connection among peers.

## The data flow

The current experiment updates `core-data` to leverage the YJS library for synchronization and merging changes. Each core-data entity record represents a YJS document and updates to the `--edit` record are broadcasted among peers.

These are the specific checkpoints:

1. REGISTER.
	- See `getSyncProvider().register( ... )` in `registerSyncConfigs`.
	- Not all entity types are sync-enabled at the moment, look at those that declare a `syncConfig` and `syncObjectType` in `rootEntitiesConfig`.
2. BOOTSTRAP.
	- See `getSyncProvider().bootstrap( ... )` in `getEntityRecord`.
	- The `bootstrap` function fetches the entity and sets up the callback that will dispatch the relevant Redux action when document changes are broadcasted from other peers.
3. UPDATE.
	- See `getSyncProvider().update( ... )` in `editEntityRecord`.
	- Each change done by a peer to the `--edit` entity record (local changes, not persisted ones) is broadcasted to the others.
	- The data that is shared is the whole block list.

This is the data flow when the peer A makes a local change:

- Peer A makes a local change.
- Peer A triggers a `getSyncProvider().update( ... )` request (see `editEntityRecord`).
- All peers (including A) receive the broadcasted change and execute the callback (see `updateHandler` in `createSyncProvider.bootstrap`).
- All peers (including A) trigger a `EDIT_ENTITY_RECORD` redux action.

## What works and what doesn't

- Undo/redo does not work.
- Changes can be persisted and the publish/update button should react accordingly for all peers.
- Offline.
	- Changes are stored in the browser's local storage (indexedDB) for each user/peer. Users can navigate away from the document and they'll see the changes when they come back.
	- Offline changes can be deleted via visiting the browser's database in all peers, then reload the document.
- Documents can get out of sync. For example:
	- Two peers open the same document.
	- One of them (A) leaves the document. Then, the remaining user (B) makes changes.
	- When A comes back to the document, the changes B made are not visible to A.
- Entities
	- Not all entities are synced. For example, global styles are not. Look at the `base` entity config for an example (it declares `syncConfig` and `syncObjectType` properties).
