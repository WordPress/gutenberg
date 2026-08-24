/**
 * Yjs should not be considered a public API. It is a third-party library that
 * _will_ experience breaking changes in the future.
 *
 * `@wordpress/sync` is a bundled package: each consumer bundles its own copy,
 * and no `wp.sync` global or `wp-sync` script handle is exposed by WordPress.
 * Two Yjs instances operating on the same document cause silent data
 * corruption:
 *
 * https://github.com/yjs/yjs/issues/438
 *
 * For that reason, sync providers registered via the `sync.providers` filter
 * must not bundle their own copy of Yjs. Each provider creator receives the
 * Yjs module used by the editor as the `Y` property of its options, alongside
 * `ydoc` and `awareness`, and must operate on documents through that instance.
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
