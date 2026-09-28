/**
 * Main entry point for @wordpress/worker-threads.
 *
 * This module provides utilities for type-safe Web Worker communication
 * using an RPC (Remote Procedure Call) pattern. It allows you to call
 * methods on a worker as if they were local async functions.
 *
 * @example
 * Main thread usage:
 * ```typescript
 * import { wrap, terminate } from '@wordpress/worker-threads';
 * import type { WorkerAPI } from './worker';
 *
 * const worker = new Worker(new URL('./worker.js', import.meta.url));
 * const api = wrap<WorkerAPI>(worker);
 *
 * const result = await api.processData(data);
 *
 * terminate(api);
 * ```
 *
 * Worker thread usage:
 * ```typescript
 * import { expose } from '@wordpress/worker-threads';
 *
 * const api = {
 *   async processData(data: ArrayBuffer): Promise<ArrayBuffer> {
 *     // ... processing
 *     return result;
 *   }
 * };
 *
 * expose(api);
 * export type WorkerAPI = typeof api;
 * ```
 */

/**
 * Wraps a Worker to provide a type-safe RPC interface.
 */
export { wrap } from './main-thread';

/**
 * Terminates a wrapped worker and cleans up resources.
 */
export { terminate } from './main-thread';

/**
 * Exposes an object's methods to be called from the main thread.
 * This should be called in the worker script.
 */
export { expose } from './worker-thread';

/**
 * Type that converts all methods to async versions.
 */
export type { Remote } from './types';
