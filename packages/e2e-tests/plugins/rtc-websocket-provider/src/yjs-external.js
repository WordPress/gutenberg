/**
 * Re-export Yjs symbols from wp.sync.Y so the bundled y-websocket and
 * y-protocols modules share the same Yjs instance as @wordpress/sync.
 * Two Yjs instances on the same page cause silent data corruption:
 * https://github.com/yjs/yjs/issues/438
 *
 * Only the symbols actually referenced by y-websocket and y-protocols
 * need to be re-exported here.
 */
const Y = window.wp.sync.Y;

export const Doc = Y.Doc;
export const applyUpdate = Y.applyUpdate;
export const encodeStateAsUpdate = Y.encodeStateAsUpdate;
export const encodeStateVector = Y.encodeStateVector;
