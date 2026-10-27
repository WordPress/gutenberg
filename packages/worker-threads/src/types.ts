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
