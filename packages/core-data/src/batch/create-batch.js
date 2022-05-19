/**
 * External dependencies
 */
import { isFunction, zip } from 'lodash';

/**
 * Internal dependencies
 */
import defaultProcessor from './default-processor';

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
 * @param {Function} [processor] Processor function. Can be used to replace the
 *                               default functionality which is to send an API
 *                               request to /v1/batch. Is given an array of
 *                               inputs and must return a promise that
 *                               resolves to an array of objects containing
 *                               either `output` or `error`.
 */
export default function createBatch( processor = defaultProcessor ) {
	let lastId = 0;
	/** @type {Array<{ input: any; resolve: ( value: any ) => void; reject: ( error: any ) => void }>} */
	let queue = [];
	const pending = new ObservableSet();

	return {
		/**
		 * Adds an input to the batch and returns a promise that is resolved or
		 * rejected when the input is processed by `batch.run()`.
		 *
		 * You may also pass a thunk which allows inputs to be added
		 * asychronously.
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
		 * @param {any|Function} inputOrThunk Input to add or thunk to execute.
		 *
		 * @return {Promise|any} If given an input, returns a promise that
		 *                       is resolved or rejected when the batch is
		 *                       processed. If given a thunk, returns the return
		 *                       value of that thunk.
		 */
		add( inputOrThunk ) {
			const id = ++lastId;
			pending.add( id );

			const add = ( input ) =>
				new Promise( ( resolve, reject ) => {
					queue.push( {
						input,
						resolve,
						reject,
					} );
					pending.delete( id );
				} );

			if ( isFunction( inputOrThunk ) ) {
				return Promise.resolve( inputOrThunk( add ) ).finally( () => {
					pending.delete( id );
				} );
			}

			return add( inputOrThunk );
		},

		/**
		 * Runs the batch. This calls `batchProcessor` and resolves or rejects
		 * all promises returned by `add()`.
		 *
		 * @return {Promise<boolean>} A promise that resolves to a boolean that is true
		 *                   if the processor returned no errors.
		 */
		async run() {
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

			for ( const pair of zip( results, queue ) ) {
				/** @type {{error?: unknown, output?: unknown}} */
				const result = pair[ 0 ];

				/** @type {{resolve: (value: any) => void; reject: (error: any) => void} | undefined} */
				const queueItem = pair[ 1 ];

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

class ObservableSet {
	constructor( ...args ) {
		this.set = new Set( ...args );
		this.subscribers = new Set();
	}

	get size() {
		return this.set.size;
	}

	add( value ) {
		this.set.add( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return this;
	}

	delete( value ) {
		const isSuccess = this.set.delete( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return isSuccess;
	}

	subscribe( subscriber ) {
		this.subscribers.add( subscriber );
		return () => {
			this.subscribers.delete( subscriber );
		};
	}
}
