/**
 * Yjs should not be considered a public API. It is a third-party library that
 * _will_ experience breaking changes in the future. However, in order to allow
 * third-party plugins to provide their own Yjs providers / sync transport, they
 * must import and consume **our instance** of Yjs due to this bug / feature:
 *
 * https://github.com/yjs/yjs/issues/438
 *
 * In other words, external code must be able to import Yjs from the
 * `@wordpress/sync` package in their code, e.g.:
 *
 * ```ts
 * import { Y } from '@wordpress/sync';
 * ```
 *
 * Additionally, this import must resolve to `wp.sync` via `DependencyExtractionWebpackPlugin`.
 * If you are using an older version of `@wordpress/scripts` that does not treat
 * `@wordpress/sync` as an unbundled package, then you can use Webpack externals
 * to manually resolve the package to the global `wp.sync` variable:
 *
 * ```ts
 * externals: {
 *   ...existingConfig.externals,
 *   // Resolve @wordpress/sync to the global `wp.sync` provided by WordPress.
 *   '@wordpress/sync': 'wp.sync',
 *
 *   // Resolve Yjs to the global `wp.sync.Y` provided by the sync package.
 *   // Since dependencies import 'yjs' directly, we need to avoid importing
 *   // and packaging two different Yjs instances, which would result in this
 *   // conflict:
 *   //
 *   // https://github.com/yjs/yjs/issues/438
 *   yjs: 'wp.sync.Y',
 * },
 * ```
 */
export * as Y from 'yjs';

/**
 * The major version of Yjs that is bundled and exported by this package. This
 * can be used by third-party code to ensure that they are targeting a compatible
 * version of Yjs.
 */
export const YJS_VERSION = '13';

/**
 * Similar to Yjs, the Awareness protocol should not be considered a public API.
 * It is a third-party library that will experience breaking changes in the
 * future.
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
