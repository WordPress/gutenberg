/**
 * Yjs should not be considered a public API. It is a third-party library that
 * _will_ experience breaking changes in the future. It is re-exported here so
 * that internal `@wordpress/*` consumers of this bundled package have a single
 * import path for Yjs.
 *
 * Note: this package is bundled into its consumers, so each consumer ends up
 * with its own copy of Yjs. Sharing Yjs documents across separately-bundled
 * scripts is not supported — see https://github.com/yjs/yjs/issues/438.
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
