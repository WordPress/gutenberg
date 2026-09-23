import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { kebabToCamelCase, withScope, afterNextFrame } from '../utils';
import { setScope, getScope, resetScope, type Scope } from '../scopes';
import { setNamespace, getNamespace, resetNamespace } from '../namespaces';

describe( 'Interactivity API', () => {
	describe( 'kebabToCamelCase', () => {
		it( 'should work exactly as the PHP version', async () => {
			expect( kebabToCamelCase( '' ) ).toBe( '' );
			expect( kebabToCamelCase( 'item' ) ).toBe( 'item' );
			expect( kebabToCamelCase( 'my-item' ) ).toBe( 'myItem' );
			expect( kebabToCamelCase( 'my_item' ) ).toBe( 'my_item' );
			expect( kebabToCamelCase( 'My-iTem' ) ).toBe( 'myItem' );
			expect( kebabToCamelCase( 'my-item-with-multiple-hyphens' ) ).toBe(
				'myItemWithMultipleHyphens'
			);
			expect( kebabToCamelCase( 'my-item-with--double-hyphens' ) ).toBe(
				'myItemWith-DoubleHyphens'
			);
			expect( kebabToCamelCase( 'my-item-with_under-score' ) ).toBe(
				'myItemWith_underScore'
			);
			expect( kebabToCamelCase( '-my-item' ) ).toBe( 'myItem' );
			expect( kebabToCamelCase( 'my-item-' ) ).toBe( 'myItem' );
			expect( kebabToCamelCase( '-my-item-' ) ).toBe( 'myItem' );
		} );
	} );

	describe( 'afterNextFrame', () => {
		afterEach( () => {
			vi.useRealTimers();
		} );

		it( 'runs on a macrotask, never on microtasks alone, and only on the timeout arm when requestAnimationFrame never fires', async () => {
			vi.useFakeTimers();
			// Prevent the `requestAnimationFrame` arm from ever resolving, so
			// only the 100 ms `setTimeout` fallback arm is left standing.
			const raf = vi
				.spyOn( window, 'requestAnimationFrame' )
				.mockImplementation( () => 0 );

			try {
				const callback = vi.fn();
				afterNextFrame( callback );

				// Drain twenty microtask turns without advancing any timer.
				// A body reduced to `Promise.resolve().then( callback )`
				// would have already run by now; the real implementation
				// needs a macrotask, so it must not have.
				for ( let i = 0; i < 20; i++ ) {
					await Promise.resolve();
				}
				expect( callback ).not.toHaveBeenCalled();

				// Still short of the 100 ms timeout arm.
				vi.advanceTimersByTime( 50 );
				expect( callback ).not.toHaveBeenCalled();

				// The 100 ms timeout arm fires, and with it the trailing
				// macrotask `setTimeout` that runs the callback.
				vi.advanceTimersByTime( 51 );
				expect( callback ).toHaveBeenCalledTimes( 1 );
			} finally {
				raf.mockRestore();
			}
		} );

		it( 'runs one macrotask after the arm that resolves it, not inside that arm’s own turn', async () => {
			vi.useFakeTimers();

			// The `requestAnimationFrame` arm is backed by a 16 ms fake
			// timer here, so a callback registered at t=0 has not run by
			// t=16 ms — it runs one macrotask later, at t=17 ms.
			const callback = vi.fn();
			afterNextFrame( callback );

			vi.advanceTimersByTime( 16 );
			expect( callback ).not.toHaveBeenCalled();

			vi.advanceTimersByTime( 1 );
			expect( callback ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'withScope', () => {
		const previousNamespace = 'previousNamespace';
		const previousScope = {
			evaluate: () => {},
			context: {},
			serverContext: {},
			ref: { current: null },
			attributes: {},
		};

		const dummyNamespace = 'testNamespace';
		const dummyScope = {
			evaluate: () => {},
			context: { test: 'normal' },
			serverContext: { test: 'normal' },
			ref: { current: null },
			attributes: {},
		};

		// Helper to mimic the wrapper used in state-proxy.ts and store-proxy.ts.
		const dummyScopeAndNS = ( callback: () => any ) => {
			setScope( dummyScope );
			setNamespace( dummyNamespace );
			try {
				return callback();
			} finally {
				resetNamespace();
				resetScope();
			}
		};

		beforeEach( () => {
			setScope( previousScope );
			setNamespace( previousNamespace );
		} );

		afterEach( () => {
			resetNamespace();
			resetScope();
		} );

		it( 'should return a function when passed a normal function', () => {
			function normalFn( x: number ) {
				return x + 1;
			}
			const wrapped = withScope( normalFn );
			expect( typeof wrapped ).toBe( 'function' );
		} );

		it( 'should call the original function, set the scope and namespace and restore them afterwards', () => {
			let called = false;
			let scope: Scope;
			let namespace: string;
			function normalFn( x: number ) {
				called = true;
				scope = getScope();
				namespace = getNamespace();
				return x * 2;
			}
			const wrapped = dummyScopeAndNS( () => withScope( normalFn ) );
			const result = wrapped( 5 );

			expect( result ).toBe( 10 );
			expect( called ).toBe( true );
			expect( scope! ).toBe( dummyScope );
			expect( namespace! ).toBe( dummyNamespace );
			// After invocation, scope and namespace are reset.
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should return an async function when passed a generator function', async () => {
			function* gen(): Generator< Promise< string >, string, string > {
				yield Promise.resolve( 'value' );
				return 'done';
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			const resultPromise = wrapped();

			expect( resultPromise ).toBeInstanceOf( Promise );

			const result = await resultPromise;

			expect( result ).toBe( 'done' );
			// After invocation, scope and namespace are reset.
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should execute a generator function step by step and yield the correct values, maintaining scope and namespace', async () => {
			const steps: Array< { scope: any; namespace: string } > = [];
			function* gen(): Generator< Promise< number >, number, number > {
				steps.push( { scope: getScope(), namespace: getNamespace() } );
				const a = yield Promise.resolve( 1 );
				steps.push( { scope: getScope(), namespace: getNamespace() } );
				const b = yield Promise.resolve( a + 1 );
				steps.push( { scope: getScope(), namespace: getNamespace() } );
				return b * 2;
			}
			const callback = dummyScopeAndNS( () => withScope( gen ) );
			const result = await callback();

			expect( result ).toBe( 4 );
			steps.forEach( ( step ) => {
				expect( step.scope ).toBe( dummyScope );
				expect( step.namespace ).toBe( dummyNamespace );
			} );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should return the resolved value when a promise is returned in generator functions', async () => {
			function* gen(): Generator<
				Promise< number >,
				Promise< number >,
				number
			> {
				const a = yield Promise.resolve( 3 );
				return Promise.resolve( a + 2 );
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			const result = await wrapped();
			expect( result ).toBe( 5 );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should accept arguments in generator functions like in normal functions', async () => {
			function* gen(
				...values: number[]
			): Generator< Promise< number >, number, number > {
				let result = 0;
				for ( const value of values ) {
					result += yield Promise.resolve( value );
				}
				return result;
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			const result = await wrapped( 1, 2, 3, 4 );
			expect( result ).toBe( 10 );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should propagate errors thrown inside a generator function', async () => {
			function* gen() {
				throw new Error( 'Test Error' );
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			await expect( wrapped() ).rejects.toThrow( 'Test Error' );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should propagate errors when a generator function returns a rejected promise', async () => {
			function* gen() {
				return Promise.reject( new Error( 'Test Error' ) );
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			await expect( wrapped() ).rejects.toThrow( 'Test Error' );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'hould handle captured errors within generator execution and resume correctly, maintaining scope and namespace', async () => {
			const steps: Array< { scope: any; namespace: string } > = [];
			function* gen(): Generator< Promise< number >, number, number > {
				let a: number;
				try {
					steps.push( {
						scope: getScope(),
						namespace: getNamespace(),
					} );
					a = yield Promise.reject( new Error( 'CatchMe' ) );
				} catch {
					steps.push( {
						scope: getScope(),
						namespace: getNamespace(),
					} );
					a = 10;
				}
				steps.push( { scope: getScope(), namespace: getNamespace() } );
				const b = yield Promise.resolve( a + 5 );
				steps.push( { scope: getScope(), namespace: getNamespace() } );
				return b;
			}
			const callback = dummyScopeAndNS( () => withScope( gen ) );
			const result = await callback();

			expect( result ).toBe( 15 );
			steps.forEach( ( step ) => {
				expect( step.scope ).toBe( dummyScope );
				expect( step.namespace ).toBe( dummyNamespace );
			} );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );

		it( 'should handle rejected promises within a generator function and throw after yielding', async () => {
			function* gen(): Generator< Promise< number >, number, number > {
				const a = yield Promise.resolve( 2 );
				yield Promise.reject( new Error( 'FinalReject' ) );
				return a;
			}
			const wrapped = dummyScopeAndNS( () => withScope( gen ) );
			await expect( wrapped() ).rejects.toThrow( 'FinalReject' );
			expect( getScope() ).toBe( previousScope );
			expect( getNamespace() ).toBe( previousNamespace );
		} );
	} );
} );
