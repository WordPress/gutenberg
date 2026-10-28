import { createStore, applyMiddleware } from 'redux';
import type { Action, Middleware } from 'redux';
import { describe, expect, expectTypeOf, it } from 'vitest';
import createMiddleware from '../';

describe( 'createMiddleware', () => {
	type TestState = number | Action | null;
	type TestAction = Action & {
		nextState?: TestState;
		value?: number;
	};

	function createStoreWithMiddleware(
		middleware: ReturnType< typeof createMiddleware >
	) {
		const reducer = ( state: TestState = null, action: TestAction ) =>
			action.nextState || state;
		return createStore( reducer, applyMiddleware( middleware ) );
	}

	it( 'should not alter dispatch flow of uncontrolled action', () => {
		const middleware = createMiddleware();
		const store = createStoreWithMiddleware( middleware );

		store.dispatch( { type: 'CHANGE', nextState: 1 } );

		expect( store.getState() ).toBe( 1 );
	} );

	it( 'should dispatch yielded actions', () => {
		const middleware = createMiddleware();
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( 1 );
	} );

	it( 'should continue only once control condition resolves', async () => {
		const middleware = createMiddleware( {
			WAIT: () => new Promise< void >( ( resolve ) => resolve() ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'WAIT' };
			yield { type: 'CHANGE', nextState: 1 };
		}

		await store.dispatch( createAction() );
		expect( store.getState() ).toBe( 1 );
	} );

	it( 'should throw if promise rejects', async () => {
		let caughtError: unknown;
		const middleware = createMiddleware( {
			WAIT_FAIL: () =>
				new Promise( ( resolve, reject ) => reject( 'Message' ) ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				caughtError = error;
			}
		}

		await store.dispatch( createAction() );
		expect( caughtError ).toBe( 'Message' );
	} );

	it( 'should throw if promise throws', async () => {
		let caughtError: unknown;
		const middleware = createMiddleware( {
			WAIT_FAIL: () =>
				new Promise( () => {
					throw new Error( 'Message' );
				} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				caughtError = error;
			}
		}

		await store.dispatch( createAction() );
		expect( caughtError ).toHaveProperty( 'message', 'Message' );
	} );

	it( 'should handle a null returned from a caught promise error', async () => {
		let caughtError: unknown;
		const middleware = createMiddleware( {
			WAIT_FAIL: () =>
				new Promise( () => {
					throw new Error( 'Message' );
				} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction(): Generator<
			TestAction,
			null | void,
			unknown
		> {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				caughtError = error;
				return null;
			}
		}
		await store.dispatch( createAction() );
		expect( caughtError ).toHaveProperty( 'message', 'Message' );
	} );

	it( 'assigns sync controlled return value into yield assignment', () => {
		const middleware = createMiddleware( {
			RETURN_TWO: () => 2,
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction(): Generator< TestAction, void, number > {
			const nextState = yield { type: 'RETURN_TWO' };
			yield { type: 'CHANGE', nextState };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( 2 );
	} );

	it( 'assigns async controlled return value into yield assignment', async () => {
		const middleware = createMiddleware( {
			WAIT: ( action ) =>
				new Promise( ( resolve ) => {
					resolve( action.value );
				} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction(): Generator< TestAction, TestAction, number > {
			const nextState = yield { type: 'WAIT', value: 2 };
			return { type: 'CHANGE', nextState };
		}

		await store.dispatch( createAction() );

		expect( store.getState() ).toBe( 2 );
	} );

	it(
		'does not recurse when action like object returns from a sync ' +
			'control',
		() => {
			const post = { type: 'post' };
			const middleware = createMiddleware( {
				UPDATE: () => post,
			} );
			const store = createStoreWithMiddleware( middleware );
			function* getPostAction(): Generator<
				TestAction,
				TestAction,
				Action
			> {
				const nextState = yield { type: 'UPDATE' };
				return { type: 'CHANGE', nextState };
			}

			store.dispatch( getPostAction() );

			expect( store.getState() ).toEqual( post );
		}
	);

	it( 'accepts synchronous and asynchronous control results', async () => {
		const middleware = createMiddleware( {
			BOOLEAN: () => true,
			NUMBER: () => 2,
			OBJECT: () => ( { type: 'post' } ),
			VOID: () => {},
			PROMISE: () => Promise.resolve( 2 ),
			RESOLVED: () => Promise.resolve(),
		} );

		expectTypeOf( middleware ).toExtend< Middleware >();
		const store = createStore(
			( state = 0 ) => state,
			applyMiddleware( middleware )
		);
		function* routine(): Generator< Action, unknown[], unknown > {
			return [
				yield { type: 'BOOLEAN' },
				yield { type: 'NUMBER' },
				yield { type: 'OBJECT' },
				yield { type: 'VOID' },
				yield { type: 'PROMISE' },
				yield { type: 'RESOLVED' },
			];
		}

		await expect( store.dispatch( routine() ) ).resolves.toEqual( [
			true,
			2,
			{ type: 'post' },
			undefined,
			2,
			undefined,
		] );
	} );

	it( 'returns a promise when dispatching a generator while preserving ordinary action dispatch', async () => {
		const store = createStore(
			( state = 0 ) => state,
			applyMiddleware( createMiddleware() )
		);
		const action = { type: 'UNCHANGED' };
		const dispatchedAction = store.dispatch( action );

		expectTypeOf( dispatchedAction ).toEqualTypeOf< typeof action >();
		expect( dispatchedAction ).toBe( action );

		function* routine() {
			return 7;
		}
		const result = store.dispatch( routine() );

		expectTypeOf( result ).toEqualTypeOf< Promise< unknown > >();
		await expect( result ).resolves.toBe( 7 );
	} );
} );
