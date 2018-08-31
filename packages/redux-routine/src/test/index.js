/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';

/**
 * Internal dependencies
 */
import createMiddleware from '../middleware';
import createRuntime from '../runtime';

describe( 'createMiddleware', () => {
	function createStoreWithMiddleware( middleware ) {
		const reducer = ( state = null, action ) => action.nextState || state;
		return createStore( reducer, applyMiddleware( middleware ) );
	}

	it( 'should not alter dispatch flow of uncontrolled action', () => {
		const runtime = createRuntime();
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );

		store.dispatch( { type: 'CHANGE', nextState: 1 } );

		expect( store.getState() ).toBe( 1 );
	} );

	it( 'should dispatch yielded actions', () => {
		const runtime = createRuntime();
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( 1 );
	} );

	it( 'should continue only once control condition resolves', ( done ) => {
		const runtime = createRuntime( {
			WAIT: () => new Promise( ( resolve ) => setTimeout( resolve, 0 ) ),
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'WAIT' };
			yield { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );
		expect( store.getState() ).toBe( null );

		jest.runAllTimers();

		// Promise resolution occurs on next tick.
		process.nextTick( () => {
			expect( store.getState() ).toBe( 1 );
			done();
		} );
	} );

	it( 'should throw if promise rejects', ( done ) => {
		const runtime = createRuntime( {
			WAIT_FAIL: () => new Promise( ( resolve, reject ) => {
				setTimeout( () => reject( 'Message' ), 0 );
			} ),
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				expect( error.message ).toBe( 'Message' );
				done();
			}
		}

		store.dispatch( createAction() );

		jest.runAllTimers();
	} );

	it( 'should throw if promise throws', ( done ) => {
		const runtime = createRuntime( {
			WAIT_FAIL: () => new Promise( () => {
				throw new Error( 'Message' );
			} ),
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				expect( error.message ).toBe( 'Message' );
				done();
			}
		}

		store.dispatch( createAction() );

		jest.runAllTimers();
	} );

	it( 'assigns sync controlled return value into yield assignment', () => {
		const runtime = createRuntime( {
			RETURN_TWO: () => 2,
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			const nextState = yield { type: 'RETURN_TWO' };
			yield { type: 'CHANGE', nextState };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( 2 );
	} );

	it( 'assigns async controlled return value into yield assignment', ( done ) => {
		const runtime = createRuntime( {
			WAIT: ( action ) => new Promise( ( resolve ) => {
				setTimeout( () => {
					resolve( action.value );
				}, 0 );
			} ),
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			const nextState = yield { type: 'WAIT', value: 2 };
			return { type: 'CHANGE', nextState };
		}

		store.dispatch( createAction() );
		expect( store.getState() ).toBe( null );

		jest.runAllTimers();

		process.nextTick( () => {
			expect( store.getState() ).toBe( 2 );
			done();
		} );
	} );

	it( 'kills continuation if control returns undefined', () => {
		const runtime = createRuntime( {
			KILL: () => { },
		} );
		const middleware = createMiddleware( runtime );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'KILL' };
			return { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( null );
	} );
} );
