/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';

/**
 * Internal dependencies
 */
import createMiddleware from '../';

jest.useFakeTimers();

describe( 'createMiddleware', () => {
	function createStoreWithMiddleware( middleware ) {
		const reducer = ( state = null, action ) => action.nextState || state;
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

	it( 'should continue only once control condition resolves', ( done ) => {
		const middleware = createMiddleware( {
			WAIT: () => new Promise( ( resolve ) => setTimeout( resolve, 0 ) ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'WAIT' };
			yield { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );
		expect( store.getState() ).toBe( null );

		jest.runAllTimers();
		expect( store.getState() ).toBe( null );

		// Promise resolution occurs on next tick.
		process.nextTick( () => {
			expect( store.getState() ).toBe( 1 );
			done();
		} );
	} );

	it( 'assigns sync controlled return value into yield assignment', () => {
		const middleware = createMiddleware( {
			RETURN_TWO: () => 2,
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			const nextState = yield { type: 'RETURN_TWO' };
			yield { type: 'CHANGE', nextState };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( 2 );
	} );

	it( 'assigns async controlled return value into yield assignment', ( done ) => {
		const middleware = createMiddleware( {
			WAIT: ( action ) => new Promise( ( resolve ) => {
				setTimeout( () => {
					resolve( action.value );
				}, 0 );
			} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			const nextState = yield { type: 'WAIT', value: 2 };
			return { type: 'CHANGE', nextState };
		}

		store.dispatch( createAction() );
		expect( store.getState() ).toBe( null );

		jest.runAllTimers();
		expect( store.getState() ).toBe( null );

		process.nextTick( () => {
			expect( store.getState() ).toBe( 2 );
			done();
		} );
	} );

	it( 'kills continuation if control returns undefined', () => {
		const middleware = createMiddleware( {
			KILL: () => {},
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			yield { type: 'KILL' };
			return { type: 'CHANGE', nextState: 1 };
		}

		store.dispatch( createAction() );

		expect( store.getState() ).toBe( null );
	} );
} );
