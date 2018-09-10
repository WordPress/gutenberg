/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';

/**
 * Internal dependencies
 */
import createMiddleware from '../';

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

	it( 'should continue only once control condition resolves', async () => {
		const middleware = createMiddleware( {
			WAIT: () => new Promise( ( resolve ) => resolve() ),
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
		const middleware = createMiddleware( {
			WAIT_FAIL: () => new Promise( ( resolve, reject ) =>
				reject( 'Message' )
			),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				expect( error.message ).toBe( 'Message' );
			}
		}

		await store.dispatch( createAction() );
	} );

	it( 'should throw if promise throws', () => {
		const middleware = createMiddleware( {
			WAIT_FAIL: () => new Promise( () => {
				throw new Error( 'Message' );
			} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			try {
				yield { type: 'WAIT_FAIL' };
			} catch ( error ) {
				expect( error.message ).toBe( 'Message' );
			}
		}

		return store.dispatch( createAction() );
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

	it( 'assigns async controlled return value into yield assignment', async () => {
		const middleware = createMiddleware( {
			WAIT: ( action ) => new Promise( ( resolve ) => {
				resolve( action.value );
			} ),
		} );
		const store = createStoreWithMiddleware( middleware );
		function* createAction() {
			const nextState = yield { type: 'WAIT', value: 2 };
			return { type: 'CHANGE', nextState };
		}

		await store.dispatch( createAction() );

		expect( store.getState() ).toBe( 2 );
	} );
} );
