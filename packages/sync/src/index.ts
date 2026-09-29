/**
 * Yjs should not be considered a public API. It is a third-party library that
 * _will_ experience breaking changes in the future.
 *
 * Two Yjs instances operating on the same document cause silent data
 * corruption:
 *
 * https://github.com/yjs/yjs/issues/438
 *
 * Engine plugins that use Yjs must use this shared export. In WordPress,
 * externalize `yjs` to `wp.sync.Y` so the editor and engine use one copy.
 * Transport providers receive an EngineSessionCodec, not a Y.Doc or Yjs
 * module. The engine owns the document and supplies updates to the transport.
 */
export * as Y from 'yjs';

/**
 * The major version of Yjs that is bundled and exported by this package. This
 * can be used by third-party code to ensure that they are targeting a compatible
 * version of Yjs.
 */
export const YJS_VERSION = '13';

/**
 * The Awareness protocol should not be considered a public API. It is a
 * third-party library that will experience breaking changes in the future.
 *
 * In general, awareness for core entity types is implemented by the `core-data`
 * package and third-party Yjs providers should not provide their own awareness
 * implementation. However, it may be desirable for custom entities to have a
 * custom awareness implementation.
 */
export { Awareness } from 'y-protocols/awareness';

/**
 * Private @wordpress/sync APIs.
 */
export { privateApis } from './private-apis';

export type * from './types';

// The engine/transport SEAM types, so engine and transport plugins can type
// their adapters, session codecs, and providers against the framework.
export type {
	LocalAwarenessState,
	AwarenessState,
	EngineUpdate,
	EngineDisposition,
	EngineLocalUpdateListener,
	EngineSessionCodec,
} from './engines/session';

// The engine SPI: an engine plugin implements `SyncEngine` (a factory of
// per-entity/collection cores) and composes it with `createSyncManager`.
export type {
	SyncEngine,
	EngineEntity,
	EngineCollection,
	EngineEntityObservers,
} from './engines/engine';
