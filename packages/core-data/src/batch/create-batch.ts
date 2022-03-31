/**
 * External dependencies
 */
import { isFunction, zip } from 'lodash';

/**
 * Internal dependencies
 */
import defaultProcessor from './default-processor';

/**
 * WordPress dependencies
 */
import type { APIFetchOptions } from '@wordpress/api-fetch';

export interface BatchResponse< Data = unknown > {
	output?: Data;
	error?: unknown;
}

export type WrappedResponse< ReturnData extends any[] > = {
	[ Index in keyof ReturnData ]: BatchResponse< ReturnData[ Index ] >;
};

export interface BatchProcessor {
	< ReturnData extends any[] >( requests: APIFetchOptions[] ): Promise<
		WrappedResponse< ReturnData >
	>;
}

interface APIFetchOptionsProducer {
	< Data, Result = Promise< Data > >(
		add: ( input: APIFetchOptions ) => Result
	): Result;
}

interface BatchItem< Data > {
	input: APIFetchOptions;
	resolve( value: Data ): void;
	reject( error: unknown ): void;
}

/**
 * Creates a batch, which can be used to combine multiple API requests into one
 * API request using the WordPress batch processing API (/v1/batch).
 *
 * ```
 * const batch = createBatch();
 * const dunePromise = batch.add( {
 *   path: '/v1/books',
 *   method: 'POST',
 *   data: { title: 'Dune' }
 * } );
 * const lotrPromise = batch.add( {
 *   path: '/v1/books',
 *   method: 'POST',
 *   data: { title: 'Lord of the Rings' }
 * } );
 * const isSuccess = await batch.run(); // Sends one POST to /v1/batch.
 * if ( isSuccess ) {
 *   console.log(
 *     'Saved two books:',
 *     await dunePromise,
 *     await lotrPromise
 *   );
 * }
 * ```
 *
 * @param processor Processor function. Can be used to replace the default
 *                  functionality which is to send an API request to /v1/batch.
 *                  Given an array of api request descriptions and resolves an
 *                  array of objects containing either `output` or `error`.
 */
export default function createBatch< ReturnData extends any[] >(
	processor: BatchProcessor = defaultProcessor
) {
	let lastId = 0;
	let queue: BatchItem< ReturnData[ number ] >[] = [];
	const pending = new ObservableSet< number >();

	return {
		/**
		 * Adds an API request to the batch and returns a promise that is
		 * resolved or rejected when the input is processed by `batch.run()`.
		 *
		 * You may also pass a thunk for adding API requests asynchronously.
		 *
		 * ```
		 * // Both are allowed:
		 * batch.add( { path: '/v1/books', ... } );
		 * batch.add( ( add ) => add( { path: '/v1/books', ... } ) );
		 * ```
		 *
		 * If a thunk is passed, `batch.run()` will pause until either:
		 *
		 * - The thunk calls its `add` argument, or;
		 * - The thunk returns a promise and that promise resolves, or;
		 * - The thunk returns a non-promise.
		 *
		 * @param  fetchOptionsProducer Input to add or thunk to execute.
		 *
		 * @return                      If given an input, returns a promise that
		 *                              is resolved or rejected when the batch is
		 *                              processed. If given a thunk, returns the return
		 *                              value of that thunk.
		 */
		add< Data >(
			fetchOptionsProducer: APIFetchOptions | APIFetchOptionsProducer
		): Promise< Data > {
			const id = ++lastId;
			pending.add( id );

			const queueForResolution = (
				fetchOptions: APIFetchOptions
			): Promise< Data > =>
				new Promise( ( resolve, reject ) => {
					queue.push( {
						input: fetchOptions,
						resolve,
						reject,
					} );
					pending.delete( id );
				} );

			if ( isFunction( fetchOptionsProducer ) ) {
				return Promise.resolve(
					fetchOptionsProducer< Data >( queueForResolution )
				).finally( () => {
					pending.delete( id );
				} );
			}

			return queueForResolution( fetchOptionsProducer );
		},

		/**
		 * Runs the batch. This calls `batchProcessor` and resolves or rejects
		 * all promises returned by `add()`.
		 *
		 * @return Resolves whether the processor succeeded without error.
		 */
		async run(): Promise< boolean > {
			if ( pending.size ) {
				await new Promise( ( resolve ) => {
					const unsubscribe = pending.subscribe( () => {
						if ( ! pending.size ) {
							unsubscribe();
							resolve( undefined );
						}
					} );
				} );
			}

			let results;

			try {
				results = await processor(
					queue.map( ( { input } ) => input )
				);

				if ( results.length !== queue.length ) {
					throw new Error(
						'run: Array returned by processor must be same size as input array.'
					);
				}
			} catch ( error ) {
				for ( const { reject } of queue ) {
					reject( error );
				}

				throw error;
			}

			let isSuccess = true;

			for ( const [ result, queueItem ] of zip( results, queue ) ) {
				if ( result?.error ) {
					queueItem?.reject( result.error );
					isSuccess = false;
				} else {
					queueItem?.resolve( result?.output ?? result );
				}
			}

			queue = [];

			return isSuccess;
		},
	};
}

class ObservableSet< T > {
	private set: Set< T >;
	private subscribers: Set< () => void >;

	constructor( ...args: T[] ) {
		this.set = new Set( args );
		this.subscribers = new Set();
	}

	get size() {
		return this.set.size;
	}

	add( value: T ) {
		this.set.add( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return this;
	}

	delete( value: T ) {
		const isSuccess = this.set.delete( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return isSuccess;
	}

	subscribe( subscriber: () => void ) {
		this.subscribers.add( subscriber );
		return () => {
			this.subscribers.delete( subscriber );
		};
	}
}
