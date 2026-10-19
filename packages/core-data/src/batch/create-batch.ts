import defaultProcessor from './default-processor';
import type {
	BatchProcessor,
	BatchRequest,
	BatchResult,
	BatchThunk,
} from './types';

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
 * @param processor Processor function. Can be used to replace the
 *                  default functionality which is to send an API
 *                  request to /v1/batch. Is given an array of
 *                  inputs and must return a promise that
 *                  resolves to an array of objects containing
 *                  either `output` or `error`.
 */
export default function createBatch< Input = BatchRequest >(
	// The default processor sends the default inputs, API requests.
	processor = defaultProcessor as unknown as BatchProcessor< Input >
) {
	let lastId = 0;
	let queue: Array< {
		input: Input;
		resolve: ( value: unknown ) => void;
		reject: ( error: unknown ) => void;
	} > = [];
	const pending = new ObservableSet< number >();

	return {
		/**
		 * Adds an input to the batch and returns a promise that is resolved or
		 * rejected when the input is processed by `batch.run()`.
		 *
		 * You may also pass a thunk which allows inputs to be added
		 * asynchronously.
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
		 * @param inputOrThunk Input to add or thunk to execute.
		 *
		 * @return If given an input, returns a promise that
		 *         is resolved or rejected when the batch is
		 *         processed. If given a thunk, returns the return
		 *         value of that thunk.
		 */
		add( inputOrThunk: Input | BatchThunk< Input > ): Promise< unknown > {
			const id = ++lastId;
			pending.add( id );

			const add = ( input: Input ) =>
				new Promise( ( resolve, reject ) => {
					queue.push( {
						input,
						resolve,
						reject,
					} );
					pending.delete( id );
				} );

			if ( typeof inputOrThunk === 'function' ) {
				// A function input is a thunk.
				return Promise.resolve(
					( inputOrThunk as BatchThunk< Input > )( add )
				).finally( () => {
					pending.delete( id );
				} );
			}

			// Not a function, so not a thunk.
			return add( inputOrThunk as Input );
		},

		/**
		 * Runs the batch. This calls `batchProcessor` and resolves or rejects
		 * all promises returned by `add()`.
		 *
		 * @return A promise that resolves to a boolean that is true
		 *         if the processor returned no errors.
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

			let results: Array< BatchResult | undefined >;

			try {
				// A raw output reads as a result with no `output` or `error`.
				results = ( await processor(
					queue.map( ( { input } ) => input )
				) ) as Array< BatchResult | undefined >;

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

			results.forEach( ( result, key ) => {
				const queueItem = queue[ key ];

				if ( result?.error ) {
					queueItem?.reject( result.error );
					isSuccess = false;
				} else {
					queueItem?.resolve( result?.output ?? result );
				}
			} );

			queue = [];

			return isSuccess;
		},
	};
}

class ObservableSet< T > {
	set: Set< T >;
	subscribers: Set< () => void >;

	constructor( ...args: [ values?: Iterable< T > | null ] ) {
		this.set = new Set( ...args );
		this.subscribers = new Set();
	}

	get size(): number {
		return this.set.size;
	}

	add( value: T ): this {
		this.set.add( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return this;
	}

	delete( value: T ): boolean {
		const isSuccess = this.set.delete( value );
		this.subscribers.forEach( ( subscriber ) => subscriber() );
		return isSuccess;
	}

	subscribe( subscriber: () => void ): () => void {
		this.subscribers.add( subscriber );
		return () => {
			this.subscribers.delete( subscriber );
		};
	}
}
