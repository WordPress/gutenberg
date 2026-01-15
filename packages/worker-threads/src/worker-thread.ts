/**
 * Internal dependencies
 */
import { MessageType, type CallMessage } from './types';
import {
	createResultMessage,
	createErrorMessage,
	isRPCMessage,
	postRPCMessage,
} from './rpc';

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
	// Set up the message listener.
	self.addEventListener( 'message', async ( event: MessageEvent ) => {
		const data = event.data;

		// Ignore non-RPC messages.
		if ( ! isRPCMessage( data ) ) {
			return;
		}

		// Only handle call messages in the worker.
		if ( data.type !== MessageType.CALL ) {
			return;
		}

		const callMessage = data as CallMessage;
		const { id, method, args } = callMessage;

		try {
			// Get the method from the target.
			const fn = ( target as Record< string, unknown > )[ method ];

			if ( typeof fn !== 'function' ) {
				throw new Error(
					`Method "${ method }" is not a function or does not exist`
				);
			}

			// Call the method with the provided arguments.
			const result = await fn.apply( target, args );

			// Send the result back to the main thread.
			const resultMessage = createResultMessage( id, result );
			postRPCMessage( self, resultMessage );
		} catch ( error ) {
			// Send the error back to the main thread.
			const errorMessage = createErrorMessage( id, error );
			postRPCMessage( self, errorMessage );
		}
	} );
}
