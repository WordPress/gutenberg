/**
 * External dependencies
 */
import { RpcProvider } from 'worker-rpc';

/**
 * Internal dependencies
 */
import { WORKER_SYMBOL, type Remote, type WithWorker } from './types';
import { findTransferables } from './transferables';

/**
 * WeakMap to store RpcProvider instances for each worker.
 */
const workerProviders = new WeakMap< Worker, RpcProvider >();

/**
 * Wraps a Worker to provide a type-safe RPC interface.
 *
 * The returned proxy object allows calling methods on the worker as if they
 * were local async functions. Each method call is automatically serialized,
 * sent to the worker, and the result is returned as a Promise.
 *
 * @example
 * ```typescript
 * const worker = new Worker(new URL('./worker.js', import.meta.url));
 * const api = wrap<MyWorkerAPI>(worker);
 *
 * // Call worker methods as async functions
 * const result = await api.processData(data);
 * ```
 *
 * @param worker - The Worker instance to wrap.
 * @return A proxy object with all exposed methods as async functions.
 */
export function wrap< T extends object >( worker: Worker ): Remote< T > {
	// Create RpcProvider if not exists for this worker.
	if ( ! workerProviders.has( worker ) ) {
		const provider = new RpcProvider( ( message, transfer ) =>
			worker.postMessage( message, transfer ?? [] )
		);
		worker.onmessage = ( e ) => provider.dispatch( e.data );
		workerProviders.set( worker, provider );
	}

	const provider = workerProviders.get( worker )!;

	// Create a proxy that intercepts method calls.
	const proxy = new Proxy( {} as Remote< T > & WithWorker, {
		get( _target, prop: string | symbol ) {
			// Return the worker for the WORKER_SYMBOL.
			if ( prop === WORKER_SYMBOL ) {
				return worker;
			}

			// Ignore symbol properties (like Symbol.toStringTag).
			if ( typeof prop === 'symbol' ) {
				return undefined;
			}

			// Return a function that sends an RPC call.
			return ( ...args: unknown[] ): Promise< unknown > => {
				const transfer = findTransferables( args );
				return provider.rpc( prop, args, transfer );
			};
		},
	} );

	return proxy;
}

/**
 * Terminates a wrapped worker and cleans up resources.
 *
 * After calling terminate, any pending calls will be rejected and the
 * worker will be stopped.
 *
 * @example
 * ```typescript
 * const api = wrap<MyWorkerAPI>(worker);
 * // ... use the API ...
 * terminate(api); // Clean up when done
 * ```
 *
 * @param remote - The wrapped worker proxy returned by wrap().
 */
export function terminate( remote: Remote< unknown > ): void {
	// Get the worker from the proxy.
	const worker = ( remote as unknown as WithWorker )[ WORKER_SYMBOL ];

	if ( ! worker ) {
		return;
	}

	// Clean up provider.
	const provider = workerProviders.get( worker );
	if ( provider ) {
		workerProviders.delete( worker );
	}

	// Terminate the worker.
	worker.terminate();
}
