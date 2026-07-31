/**
 * External dependencies
 */
import {
	defineProxy,
	type Adapter,
	type SendMessage,
	type OnMessage,
} from 'comctx';

/**
 * Adapter for providing (worker exposing methods to main thread).
 */
class WorkerProvideAdapter implements Adapter {
	sendMessage: SendMessage = ( message, transfer ) => {
		self.postMessage( message, { transfer } );
	};

	onMessage: OnMessage = ( callback ) => {
		const handler = ( event: MessageEvent ) => callback( event.data );
		self.addEventListener( 'message', handler );
		return () => self.removeEventListener( 'message', handler );
	};
}

/**
 * Normalizes an arbitrary thrown value into an `Error` with a non-empty
 * message.
 *
 * The RPC reply sent back to the main thread only carries the error
 * *message*. Thrown values without one - e.g. a `WebAssembly.Exception`
 * escaping a wasm module, a thrown string, or an `Error` with an empty
 * message - would otherwise be indistinguishable from a successful
 * `undefined` result on the main thread, so the caller's promise would
 * resolve instead of reject. See
 * https://github.com/WordPress/gutenberg/issues/80259.
 *
 * @param error - Thrown value.
 * @return An `Error` with a non-empty message.
 */
function normalizeThrowable( error: unknown ): Error {
	if ( error instanceof Error && error.message ) {
		return error;
	}

	let message = '';
	try {
		message = String( error );
	} catch {
		// Ignore values that cannot be stringified.
	}

	return new Error( message || 'Unknown error in worker thread' );
}

/**
 * Wraps all methods of a target object so that any thrown value is
 * normalized into an `Error` with a non-empty message before it reaches
 * the RPC layer.
 *
 * @param target - Object containing methods to wrap.
 * @return A copy of the object with all methods wrapped.
 */
function withNormalizedErrors< T extends object >( target: T ): T {
	const wrapped: Record< string, unknown > = {};

	for ( const key of Object.keys( target ) ) {
		const value = ( target as Record< string, unknown > )[ key ];

		if ( typeof value !== 'function' ) {
			wrapped[ key ] = value;
			continue;
		}

		wrapped[ key ] = async ( ...args: unknown[] ) => {
			try {
				return await value.apply( target, args );
			} catch ( error ) {
				throw normalizeThrowable( error );
			}
		};
	}

	return wrapped as T;
}

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
	// Create the provide function using defineProxy with the target,
	// normalizing thrown values so every failure reaches the main
	// thread as a rejection.
	const [ provide ] = defineProxy( () => withNormalizedErrors( target ), {
		namespace: '__wordpress_worker__',
		heartbeatCheck: false,
		transfer: true,
	} );

	// Start providing the target through the adapter.
	provide( new WorkerProvideAdapter() );
}
