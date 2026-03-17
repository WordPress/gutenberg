/**
 * Internal dependencies
 */
import { combineReducers } from '../combine-reducers';

function counterReducer( count = 0, action ) {
	if ( action.type === 'INC' ) {
		return count + 1;
	}
	return count;
}

describe( 'combineReducers', () => {
	it( 'initializes state', () => {
		const reducer = combineReducers( { foo: counterReducer } );
		expect( reducer( undefined, { type: 'INIT' } ) ).toEqual( { foo: 0 } );
	} );

	it( 'dispatches actions to subreducers', () => {
		const reducer = combineReducers( { foo: counterReducer } );
		expect( reducer( { foo: 1 }, { type: 'INC' } ) ).toEqual( { foo: 2 } );
	} );

	it( 'returns identical state when there is no change', () => {
		const reducer = combineReducers( { foo: counterReducer } );
		const state = { foo: 1 };
		expect( reducer( state, { type: 'NOOP' } ) ).toBe( state );
	} );

	it( 'returns identical substate when there is no change', () => {
		const reducer = combineReducers( {
			foo: counterReducer,
			bar: combineReducers( { baz: ( s ) => s } ),
		} );
		const prevState = { foo: 1, bar: { baz: 1 } };
		const nextState = reducer( prevState, { type: 'INC' } );
		expect( nextState.foo ).toBe( 2 ); // changed
		expect( nextState.bar ).toBe( prevState.bar ); // not changed
	} );

	it( 'does not mind undefined state', () => {
		const reducer = combineReducers( { foo: ( s ) => s } );
		// combineReducers from Redux would throw an exception when a reducer returns
		// `undefined` state, but we don't mind and treat is as any other value.
		expect( reducer( undefined, { type: 'INIT' } ) ).toEqual( {
			foo: undefined,
		} );
	} );

	it( 'does not mind unknown state keys', () => {
		const reducer = combineReducers( { foo: counterReducer } );
		// combineReducers from Redux would warn about the unknown `bar` key as
		// there is no reducer for it, but we don't mind and just ignore it.
		expect( reducer( { foo: 1, bar: 1 }, { type: 'INC' } ) ).toEqual( {
			foo: 2,
		} );
	} );

	it( 'supports a "unit" reducer with no subreducers', () => {
		const reducer = combineReducers( {} );
		const initialState = reducer( undefined, { type: 'INIT' } );
		expect( initialState ).toEqual( {} );
		const nextState = reducer( initialState, { type: 'INC' } );
		expect( nextState ).toBe( initialState );
	} );
} );
