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
	// Create the provide function using defineProxy with the target.
	const [ provide ] = defineProxy( () => target, {
		namespace: '__wordpress_worker__',
		heartbeatCheck: false,
		transfer: true,
	} );

	// Start providing the target through the adapter.
	provide( new WorkerProvideAdapter() );
}
