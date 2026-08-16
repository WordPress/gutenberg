/**
 * Re-exports the Yjs symbols of the instance `@wordpress/sync` hands to
 * provider creators, so the bundled y-websocket and y-protocols modules share
 * that instance. Two Yjs instances on the same page cause silent data
 * corruption: https://github.com/yjs/yjs/issues/438
 *
 * `@wordpress/sync` is bundled into its consumers, so there is no `wp.sync`
 * global to read from. The bindings below are live: `setYjs()` must run before
 * any y-websocket / y-protocols code that touches Yjs, which is guaranteed
 * because the provider creator receives `Y` before constructing the provider.
 *
 * Only the symbols actually referenced by y-websocket and y-protocols need to
 * be re-exported here.
 */
export let Doc;
export let applyUpdate;
export let encodeStateAsUpdate;
export let encodeStateVector;

export function setYjs( Y ) {
	( { Doc, applyUpdate, encodeStateAsUpdate, encodeStateVector } = Y );
}
