/**
 * Message types for the RPC protocol.
 */
export enum MessageType {
	/** Main thread → Worker: method call request. */
	CALL = 1,
	/** Worker → Main thread: successful result. */
	RESULT = 2,
	/** Worker → Main thread: error result. */
	ERROR = 3,
}

/**
 * Message sent from main thread to worker to invoke a method.
 */
export interface CallMessage {
	type: MessageType.CALL;
	/** Unique identifier for this call, used to match responses. */
	id: number;
	/** Name of the method to invoke on the exposed object. */
	method: string;
	/** Arguments to pass to the method. */
	args: unknown[];
}

/**
 * Message sent from worker to main thread with a successful result.
 */
export interface ResultMessage {
	type: MessageType.RESULT;
	/** Matches the id from the corresponding CallMessage. */
	id: number;
	/** The return value from the method. */
	result: unknown;
}

/**
 * Message sent from worker to main thread when an error occurs.
 */
export interface ErrorMessage {
	type: MessageType.ERROR;
	/** Matches the id from the corresponding CallMessage. */
	id: number;
	/** Serialized error information. */
	error: {
		message: string;
		name?: string;
		stack?: string;
	};
}

/**
 * Union type of all RPC messages.
 */
export type RPCMessage = CallMessage | ResultMessage | ErrorMessage;

/**
 * Converts a type to its "remote" version where all methods become async.
 *
 * This type transformation ensures that when calling methods on a wrapped
 * worker, the return types are properly wrapped in Promises.
 */
export type Remote< T > = {
	[ K in keyof T ]: T[ K ] extends ( ...args: infer A ) => infer R
		? ( ...args: A ) => Promise< Awaited< R > >
		: never;
};

/**
 * Internal symbol used to store the worker reference on the proxy.
 */
export const WORKER_SYMBOL = Symbol( 'worker' );

/**
 * Interface for objects that have an associated worker.
 */
export interface WithWorker {
	[ WORKER_SYMBOL ]: Worker;
}
