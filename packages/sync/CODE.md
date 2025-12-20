# Status of the sync experiment in Gutenberg

The sync package provides an implementation of real-time collaboration in Gutenberg.

Relevant docs and discussions:

-   https://make.wordpress.org/core/2023/07/13/real-time-collaboration-architecture/
-   https://github.com/WordPress/gutenberg/issues/52593
-   https://github.com/WordPress/gutenberg/discussions/65012
-   https://docs.yjs.dev/

## Enable the experiment

The real-time collaboration experiment must be enabled on the "Gutenberg > Experiments" page. A WebRTC provider with HTTP signaling is used to connect peers.

When it is enabled, the following global variables are defined::

-   `window.__experimentalEnableSync` (`boolean`): Used by the `core-data` package to determine whether entity syncing is available.
-   `window.__experimentalCollaborativeEditingSecret` (`string`). A secret (stored in a WordPress option) used by the WebRTC provider to create a secure connection between peers.

## The data flow

Each entity with sync enabled is represented by a CRDT (Yjs) document. Local edits (unsaved changes) to an entity record are applied to its CRDT document, which is synced with other peers via a provider. Those peers use the CRDT document to update their local state.

These are the specific checkpoints:

1. **CONFIG**: The entity's config defines a `syncConfig` property to enable syncing for that entity type and define its behavior.
    - See `packages/core-data/src/entities.js`.
    - Not all entities are sync-enabled; look for those that define a `syncConfig` property.
    - Not all properties are synced; look for the `syncedProperties` set that is passed as an argument to various functions.
2. **LOAD**: When an entity record is loaded for the first time and it supports syncing, it is loaded into the `syncManager` to provide handlers for various lifecycle events.
    - See `getEntityRecord` in `packages/core-data/src/resolvers.js`.
    - See `syncManager.load()` in this package.
3. **LOCAL CHANGES**: When local changes are made to an entity record, it is applied to the entity's CRDT document, which is synced with peers.
    - See `editEntityRecord` in `packages/core-data/src/actions.js`.
    - See `syncManager.update()` in this package.
4. **REMOTE CHANGES**: When an entity's CRDT document is updated by a remote peer, changes are extracted and the entity record is updated in the local store.
    - See `updateEntityRecord` in this package.

While the Redux actions in `core-data` and the `syncManager` orchestrate this data flow, the behavior of what gets synced is controlled by the entity's `syncConfig`:

-   `applyChangesToCRDTDoc` determines how (or if) local changes are applied to the CRDT document.
-   `getChangesFromCRDTDoc` determines how (or if) changes from the CRDT document are extracted and applied to the entity record.
-   `supports` is a hash that declares support for various sync features, present and future.

An entity's `syncConfig` "owns" the sync behavior of the entity (especially via `applyChangesToCRDTDoc` and `getChangesFromCRDTDoc`) and it should not delegate or leak that responsibility to other parts of the codebase.
