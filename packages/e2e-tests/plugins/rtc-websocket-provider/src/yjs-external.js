/**
 * Shared-Yjs shim for the bundled y-websocket and y-protocols modules.
 *
 * The plugin build aliases the `yjs` module specifier to this file, so the
 * bundled y-websocket and y-protocols modules resolve Yjs symbols here
 * instead of bundling their own copy. Two Yjs instances on the same page
 * cause silent data corruption: https://github.com/yjs/yjs/issues/438
 *
 * Only the symbols actually referenced by y-websocket and y-protocols
 * need to be re-exported here.
 */
export let Doc;
export let applyUpdate;
export let encodeStateAsUpdate;
export let encodeStateVector;

export function setYjsModule( Y ) {
	( { Doc, applyUpdate, encodeStateAsUpdate, encodeStateVector } = Y );
}
