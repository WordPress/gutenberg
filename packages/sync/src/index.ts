/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */

/**
 * Exported copy of Yjs so that consumers of this package don't need to install it.
 */
export * as Y from 'yjs';

export { CRDT_RECORD_MAP_KEY } from './config';
export { connectIndexDb } from './connect-indexdb';
export { createWebRTCConnection } from './create-webrtc-connection';
export { SyncProvider } from './provider';
export type * from './types';
