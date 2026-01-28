/**
 * Wraps a function and logs the time it takes to execute.
 *
 * @param fn - The function to be wrapped.
 */
export function logPerformanceTiming<
	Params extends Array< unknown >,
	ReturnType = void,
>( fn: ( ...args: Params ) => ReturnType ): typeof fn {
	return function ( this: unknown, ...args: Params ): ReturnType {
		const start = performance.now();
		const result = fn.apply( this, args );
		const end = performance.now();

		// eslint-disable-next-line no-console
		console.log( `${ fn.name } took ${ ( end - start ).toFixed( 2 ) } ms` );

		return result;
	};
}

/**
 * A pass-through function that invokes the provided function with its arguments
 * without moidyfing its type.
 *
 * @param fn - The function to be invoked.
 */
export function passThru< T extends ( ...args: any[] ) => any >( fn: T ): T {
	return ( ( ...args: Parameters< T > ): ReturnType< T > =>
		fn( ...args ) ) as T;
}

/**
 * Wraps a function so that every invocation is delayed until the next tick of
 * the event loop.
 *
 * @param fn - The function to be scheduled.
 */
export function yieldToEventLoop< Params extends Array< unknown > >(
	fn: ( ...args: Params ) => void
): typeof fn {
	return function ( this: unknown, ...args: Params ): void {
		setTimeout( () => {
			fn.apply( this, args );
		}, 0 );
	};
}
