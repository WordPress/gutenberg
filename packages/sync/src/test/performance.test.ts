/**
 * External dependencies
 */
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	logPerformanceTiming,
	passThru,
	yieldToEventLoop,
} from '../performance';

describe( 'performance utilities', () => {
	describe( 'logPerformanceTiming', () => {
		let consoleSpy: jest.SpiedFunction< typeof console.log >;

		beforeEach( () => {
			consoleSpy = jest
				.spyOn( console, 'log' )
				.mockImplementation( () => {} );
		} );

		afterEach( () => {
			consoleSpy.mockRestore();
		} );

		it( 'calls the wrapped function and returns its result', () => {
			function add( a: number, b: number ): number {
				return a + b;
			}

			const wrapped = logPerformanceTiming( add );
			const result = wrapped( 2, 3 );

			expect( result ).toBe( 5 );
		} );

		it( 'logs the function name and execution time', () => {
			function myFunction(): void {}

			const wrapped = logPerformanceTiming( myFunction );
			wrapped();

			expect( consoleSpy ).toHaveBeenCalledTimes( 1 );
			expect( consoleSpy.mock.calls[ 0 ][ 0 ] ).toMatch(
				/^myFunction took \d+\.\d{2} ms$/
			);
		} );

		it( 'passes all arguments to the wrapped function', () => {
			const fn = jest.fn( ( a: number, b: string, c: boolean ) => {
				return `${ a }-${ b }-${ c }`;
			} );

			const wrapped = logPerformanceTiming( fn );
			const result = wrapped( 42, 'test', true );

			expect( fn ).toHaveBeenCalledWith( 42, 'test', true );
			expect( result ).toBe( '42-test-true' );
		} );

		it( 'preserves the this context', () => {
			const obj = {
				value: 10,
				getValue( this: { value: number } ): number {
					return this.value;
				},
			};

			const wrapped = logPerformanceTiming( obj.getValue );
			const result = wrapped.call( obj );

			expect( result ).toBe( 10 );
		} );

		it( 'handles functions that throw errors', () => {
			function throwError(): never {
				throw new Error( 'test error' );
			}

			const wrapped = logPerformanceTiming( throwError );

			expect( () => wrapped() ).toThrow( 'test error' );
		} );

		it( 'handles functions with no return value', () => {
			let sideEffect = 0;
			function incrementSideEffect(): void {
				sideEffect += 1;
			}

			const wrapped = logPerformanceTiming( incrementSideEffect );
			const result = wrapped();

			expect( result ).toBeUndefined();
			expect( sideEffect ).toBe( 1 );
		} );

		it( 'handles anonymous functions', () => {
			const wrapped = logPerformanceTiming( () => 'result' );
			const result = wrapped();

			expect( result ).toBe( 'result' );
			expect( consoleSpy ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'passThru', () => {
		it( 'returns a function that calls the original function', () => {
			const fn = jest.fn( () => 'result' );

			const wrapped = passThru( fn );
			const result = wrapped();

			expect( fn ).toHaveBeenCalledTimes( 1 );
			expect( result ).toBe( 'result' );
		} );

		it( 'passes all arguments to the original function', () => {
			const fn = jest.fn( ( a: number, b: string ) => `${ a }-${ b }` );

			const wrapped = passThru( fn );
			const result = wrapped( 42, 'test' );

			expect( fn ).toHaveBeenCalledWith( 42, 'test' );
			expect( result ).toBe( '42-test' );
		} );

		it( 'preserves the function return type', () => {
			function getNumber(): number {
				return 42;
			}

			const wrapped = passThru( getNumber );
			const result: number = wrapped();

			expect( result ).toBe( 42 );
		} );

		it( 'handles functions with rest parameters', () => {
			const sum = ( ...numbers: number[] ): number =>
				numbers.reduce( ( a, b ) => a + b, 0 );

			const wrapped = passThru( sum );
			const result = wrapped( 1, 2, 3, 4, 5 );

			expect( result ).toBe( 15 );
		} );

		it( 'handles async functions', async () => {
			const asyncFn = async ( value: string ): Promise< string > => {
				return `async-${ value }`;
			};

			const wrapped = passThru( asyncFn );
			const result = await wrapped( 'test' );

			expect( result ).toBe( 'async-test' );
		} );

		it( 'handles functions that throw errors', () => {
			const fn = (): never => {
				throw new Error( 'test error' );
			};

			const wrapped = passThru( fn );

			expect( () => wrapped() ).toThrow( 'test error' );
		} );
	} );

	describe( 'yieldToEventLoop', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'delays function execution to the next tick', () => {
			const fn = jest.fn();

			const wrapped = yieldToEventLoop( fn );
			wrapped();

			expect( fn ).not.toHaveBeenCalled();

			jest.runAllTimers();

			expect( fn ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'passes all arguments to the wrapped function', () => {
			const fn = jest.fn( ( a: number, b: string ) => `${ a }-${ b }` );

			const wrapped = yieldToEventLoop( fn );
			wrapped( 42, 'test' );

			jest.runAllTimers();

			expect( fn ).toHaveBeenCalledWith( 42, 'test' );
		} );

		it( 'preserves the this context', () => {
			const obj = {
				value: 10,
				logValue: jest.fn( function ( this: { value: number } ) {
					return this.value;
				} ),
			};

			const wrapped = yieldToEventLoop( obj.logValue );
			wrapped.call( obj );

			jest.runAllTimers();

			expect( obj.logValue ).toHaveBeenCalled();
			expect( obj.logValue.mock.instances[ 0 ] ).toBe( obj );
		} );

		it( 'handles multiple invocations', () => {
			const fn = jest.fn();

			const wrapped = yieldToEventLoop( fn );
			wrapped();
			wrapped();
			wrapped();

			expect( fn ).not.toHaveBeenCalled();

			jest.runAllTimers();

			expect( fn ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'each invocation is independent', () => {
			const calls: number[] = [];
			const fn = ( value: number ): void => {
				calls.push( value );
			};

			const wrapped = yieldToEventLoop( fn );
			wrapped( 1 );
			wrapped( 2 );
			wrapped( 3 );

			jest.runAllTimers();

			expect( calls ).toEqual( [ 1, 2, 3 ] );
		} );

		it( 'uses setTimeout with 0ms delay', () => {
			const setTimeoutSpy = jest.spyOn( global, 'setTimeout' );
			const fn = jest.fn();

			const wrapped = yieldToEventLoop( fn );
			wrapped();

			expect( setTimeoutSpy ).toHaveBeenCalledWith(
				expect.any( Function ),
				0
			);

			setTimeoutSpy.mockRestore();
		} );

		it( 'returns void', () => {
			const fn = jest.fn( () => 'result' );

			const wrapped = yieldToEventLoop( fn as () => void );
			const result = wrapped();

			expect( result ).toBeUndefined();
		} );
	} );
} );
