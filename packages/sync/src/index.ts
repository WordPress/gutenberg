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
 *
 * A provider that bundles third-party code importing `yjs` directly (for
 * example `y-websocket`) can share the editor's Yjs instance through a shim
 * module. The shim re-exports the Yjs symbols the bundled code uses and fills
 * them in at runtime from the `Y` option:
 *
 * ```ts
 * // yjs-shim.js
 * export let Doc;
 * export let applyUpdate;
 * export let encodeStateAsUpdate;
 * export let encodeStateVector;
 *
 * export function setYjsModule( Y ) {
 *   ( { Doc, applyUpdate, encodeStateAsUpdate, encodeStateVector } = Y );
 * }
 * ```
 *
 * The build then aliases the `yjs` module specifier to the shim, so bundled
 * dependencies resolve their Yjs imports to it instead of packaging a second
 * copy. For example, with webpack:
 *
 * ```ts
 * resolve: {
 *   alias: {
 *     yjs: path.resolve( __dirname, 'src/yjs-shim.js' ),
 *   },
 * },
 * ```
 *
 * Finally, the provider creator initializes the shim before using any of the
 * bundled code:
 *
 * ```ts
 * import { WebsocketProvider } from 'y-websocket';
 * import { setYjsModule } from './yjs-shim';
 *
 * const createProvider = async ( { awareness, ydoc, Y } ) => {
 *   setYjsModule( Y );
 *
 *   const provider = new WebsocketProvider( url, room, ydoc, { awareness } );
 *   // ...
 * };
 * ```
 *
 * See `packages/e2e-tests/plugins/rtc-websocket-provider` for a complete
 * working example.
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
