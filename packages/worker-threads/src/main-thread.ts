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
 * Internal dependencies
 */
import { WORKER_SYMBOL, type Remote, type WithWorker } from './types';

/**
 * Adapter for injecting (main thread calling worker).
 */
class WorkerInjectAdapter implements Adapter {
	private worker: Worker;

	constructor( worker: Worker ) {
		this.worker = worker;
	}

	sendMessage: SendMessage = ( message, transfer ) => {
		this.worker.postMessage( message, transfer );
	};

	onMessage: OnMessage = ( callback ) => {
		const handler = ( event: MessageEvent ) => callback( event.data );
		this.worker.addEventListener( 'message', handler );
		return () => this.worker.removeEventListener( 'message', handler );
	};
}

/**
 * WeakMap to store workers for each remote proxy.
 */
const remoteWorkers = new WeakMap< object, Worker >();

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
	// Create the inject function using defineProxy with an empty object
	// (the actual implementation is on the worker side).
	const [ , inject ] = defineProxy( () => ( {} ) as T, {
		namespace: '__wordpress_worker__',
		heartbeatCheck: false,
		transfer: true,
	} );

	// Create the proxy using the injector.
	const comctxRemote = inject( new WorkerInjectAdapter( worker ) );

	// Store the worker reference.
	remoteWorkers.set( comctxRemote as object, worker );

	// Create a wrapper proxy that adds WORKER_SYMBOL support.
	const proxy = new Proxy( comctxRemote as Remote< T > & WithWorker, {
		get( target, prop: string | symbol ) {
			// Return the worker for the WORKER_SYMBOL.
			if ( prop === WORKER_SYMBOL ) {
				return worker;
			}

			// Delegate all other property access to the comctx remote.
			return Reflect.get( target, prop );
		},
	} );

	// Store the worker for the proxy as well.
	remoteWorkers.set( proxy, worker );

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

	// Clean up the worker reference.
	remoteWorkers.delete( remote as object );

	// Terminate the worker.
	worker.terminate();
}
