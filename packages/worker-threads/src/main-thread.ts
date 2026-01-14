/**
 * Internal dependencies
 */
import {
	MessageType,
	WORKER_SYMBOL,
	type Remote,
	type WithWorker,
	type ResultMessage,
	type ErrorMessage,
} from './types';
import {
	generateCallId,
	createCallMessage,
	isRPCMessage,
	postRPCMessage,
} from './rpc';

/**
 * Map of pending calls waiting for responses, keyed by call ID.
 */
interface PendingCall {
	resolve: ( value: unknown ) => void;
	reject: ( error: Error ) => void;
}

/**
 * WeakMap to store pending calls for each worker.
 */
const workerPendingCalls = new WeakMap< Worker, Map< number, PendingCall > >();

/**
 * WeakMap to store message handlers for cleanup.
 */
const workerMessageHandlers = new WeakMap<
	Worker,
	( event: MessageEvent ) => void
>();

/**
 * Creates a message handler for a worker.
 *
 * @param worker - The worker to handle messages for.
 * @return The message handler function.
 */
function createMessageHandler(
	worker: Worker
): ( event: MessageEvent ) => void {
	return ( event: MessageEvent ) => {
		const data = event.data;

		// Ignore non-RPC messages.
		if ( ! isRPCMessage( data ) ) {
			return;
		}

		// Only handle result and error messages on the main thread.
		if (
			data.type !== MessageType.RESULT &&
			data.type !== MessageType.ERROR
		) {
			return;
		}

		const pendingCalls = workerPendingCalls.get( worker );
		if ( ! pendingCalls ) {
			return;
		}

		const pending = pendingCalls.get( data.id );
		if ( ! pending ) {
			return;
		}

		// Remove the pending call.
		pendingCalls.delete( data.id );

		if ( data.type === MessageType.RESULT ) {
			const resultMessage = data as ResultMessage;
			pending.resolve( resultMessage.result );
		} else {
			const errorMessage = data as ErrorMessage;
			const error = new Error( errorMessage.error.message );
			if ( errorMessage.error.name ) {
				error.name = errorMessage.error.name;
			}
			if ( errorMessage.error.stack ) {
				error.stack = errorMessage.error.stack;
			}
			pending.reject( error );
		}
	};
}

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
	// Initialize pending calls map for this worker.
	if ( ! workerPendingCalls.has( worker ) ) {
		workerPendingCalls.set( worker, new Map() );

		// Set up message handler.
		const handler = createMessageHandler( worker );
		workerMessageHandlers.set( worker, handler );
		worker.addEventListener( 'message', handler );
	}

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
				return new Promise( ( resolve, reject ) => {
					const pendingCalls = workerPendingCalls.get( worker );

					if ( ! pendingCalls ) {
						reject( new Error( 'Worker has been terminated' ) );
						return;
					}

					// Generate ID and store the pending call.
					const id = generateCallId();
					pendingCalls.set( id, { resolve, reject } );

					// Send the call message.
					const message = createCallMessage( id, prop, args );
					postRPCMessage( worker, message );
				} );
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

	// Clean up pending calls.
	const pendingCalls = workerPendingCalls.get( worker );
	if ( pendingCalls ) {
		const error = new Error( 'Worker terminated' );
		for ( const pending of pendingCalls.values() ) {
			pending.reject( error );
		}
		pendingCalls.clear();
		workerPendingCalls.delete( worker );
	}

	// Remove message handler.
	const handler = workerMessageHandlers.get( worker );
	if ( handler ) {
		worker.removeEventListener( 'message', handler );
		workerMessageHandlers.delete( worker );
	}

	// Terminate the worker.
	worker.terminate();
}
