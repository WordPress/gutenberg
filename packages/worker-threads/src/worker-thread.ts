/**
 * External dependencies
 */
import { RpcProvider } from 'worker-rpc';

/**
 * Internal dependencies
 */
import { findTransferables } from './transferables';

/**
 * Exposes an object's methods to be called from the main thread.
 *
 * This function should be called in the worker script to make methods
 * available for RPC calls. Only methods (functions) on the object will
 * be exposed; other properties are ignored.
 *
 * @example
 * ```typescript
 * // worker.ts
 * import { expose } from '@wordpress/worker-threads/worker';
 *
 * const api = {
 *   async processImage(buffer: ArrayBuffer): Promise<ArrayBuffer> {
 *     // ... processing logic
 *     return resultBuffer;
 *   },
 *
 *   async calculateSum(a: number, b: number): Promise<number> {
 *     return a + b;
 *   }
 * };
 *
 * expose(api);
 *
 * // Export the type for use with wrap() on main thread
 * export type WorkerAPI = typeof api;
 * ```
 *
 * @param target - Object containing methods to expose to the main thread.
 */
export function expose< T extends object >( target: T ): void {
	const provider = new RpcProvider( ( message, transfer ) =>
		self.postMessage( message, { transfer: transfer ?? [] } )
	);

	self.onmessage = ( e ) => provider.dispatch( e.data );

	// Register all methods from target.
	for ( const key of Object.keys( target ) ) {
		const fn = ( target as Record< string, unknown > )[ key ];
		if ( typeof fn === 'function' ) {
			provider.registerRpcHandler( key, async ( ...args: unknown[] ) => {
				const result = await fn.apply( target, args );
				// Return with transferables for efficient transfer.
				return { result, transfer: findTransferables( [ result ] ) };
			} );
		}
	}
}
