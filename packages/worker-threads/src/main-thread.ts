import {
	defineProxy,
	type Adapter,
	type SendMessage,
	type OnMessage,
} from 'comctx';
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
 * Internal state tracked for each wrapped worker.
 *
 * comctx only settles a call promise when a response message arrives from
 * the worker, so a worker that crashes, fails to initialize, or is
 * terminated mid-call would otherwise leave its call promises pending
 * forever. Pending rejecters are tracked here so those promises can be
 * rejected when the worker fails or is terminated.
 */
interface WorkerState {
	worker: Worker;
	/** Rejecters for calls that have not settled yet. */
	pendingRejects: Set< ( reason: Error ) => void >;
	/** Set once the worker has failed or been terminated. */
	failure?: Error;
	/** Removes the worker error event listeners. */
	removeListeners: () => void;
}

/**
 * WeakMap to store the state for each remote proxy.
 */
const remoteStates = new WeakMap< object, WorkerState >();

/**
 * Rejects all pending calls and marks the worker as failed so that
 * subsequent calls reject immediately instead of hanging.
 *
 * @param state Worker state.
 * @param error Rejection reason.
 */
function failWorker( state: WorkerState, error: Error ): void {
	state.failure ??= error;
	for ( const reject of state.pendingRejects ) {
		reject( state.failure );
	}
	state.pendingRejects.clear();
}

/**
 * Wraps a Worker to provide a type-safe RPC interface.
 *
 * The returned proxy object allows calling methods on the worker as if they
 * were local async functions. Each method call is automatically serialized,
 * sent to the worker, and the result is returned as a Promise.
 *
 * If the worker fails (its `error` or `messageerror` event fires) or is
 * terminated via terminate(), all pending calls are rejected and any
 * subsequent calls reject immediately.
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

	const onError = ( event: Event ) => {
		const message = ( event as ErrorEvent ).message;
		failWorker(
			state,
			new Error(
				message
					? `Worker error: ${ message }`
					: 'Worker error: the worker crashed or failed to load.'
			)
		);
	};
	const onMessageError = () => {
		failWorker(
			state,
			new Error( 'Worker error: a message could not be deserialized.' )
		);
	};

	// Detect worker failures (crash, failed script load/instantiation, or
	// undeserializable messages) so pending calls do not hang forever.
	worker.addEventListener( 'error', onError );
	worker.addEventListener( 'messageerror', onMessageError );

	const state: WorkerState = {
		worker,
		pendingRejects: new Set(),
		removeListeners: () => {
			worker.removeEventListener( 'error', onError );
			worker.removeEventListener( 'messageerror', onMessageError );
		},
	};

	// Create a wrapper proxy that adds WORKER_SYMBOL support and tracks
	// pending calls so they can be rejected on worker failure/termination.
	const proxy = new Proxy( comctxRemote as Remote< T > & WithWorker, {
		get( target, prop: string | symbol ) {
			// Return the worker for the WORKER_SYMBOL.
			if ( prop === WORKER_SYMBOL ) {
				return worker;
			}

			// Delegate all other property access to the comctx remote.
			const value = Reflect.get( target, prop );

			if ( typeof value !== 'function' ) {
				return value;
			}

			return ( ...args: unknown[] ) => {
				if ( state.failure ) {
					return Promise.reject( state.failure );
				}

				return new Promise( ( resolve, reject ) => {
					state.pendingRejects.add( reject );
					// Wrap the call so a synchronous throw or a non-thenable
					// return value still removes the rejecter from the set.
					Promise.resolve()
						.then( () => value( ...args ) )
						.then(
							( result ) => {
								state.pendingRejects.delete( reject );
								resolve( result );
							},
							( error ) => {
								state.pendingRejects.delete( reject );
								reject( error );
							}
						);
				} );
			};
		},
	} );

	// Store the state for the proxy.
	remoteStates.set( proxy, state );

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
	const state = remoteStates.get( remote as object );

	if ( ! state ) {
		return;
	}

	// Reject pending calls; they would otherwise never settle.
	failWorker( state, new Error( 'Worker was terminated.' ) );

	state.removeListeners();

	// Clean up the state reference.
	remoteStates.delete( remote as object );

	// Terminate the worker.
	state.worker.terminate();
}
