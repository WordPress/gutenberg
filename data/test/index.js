/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { registerReducer, registerSelectors, select, query, subscribe } from '../';

describe( 'store', () => {
	it( 'Should append reducers to the state', () => {
		const reducer1 = () => 'chicken';
		const reducer2 = () => 'ribs';

		const store = registerReducer( 'red1', reducer1 );
		expect( store.getState() ).toEqual( 'chicken' );

		const store2 = registerReducer( 'red2', reducer2 );
		expect( store2.getState() ).toEqual( 'ribs' );
	} );
} );

describe( 'select', () => {
	it( 'registers multiple selectors to the public API', () => {
		const store = registerReducer( 'reducer1', () => 'state1' );
		const selector1 = jest.fn( () => 'result1' );
		const selector2 = jest.fn( () => 'result2' );

		registerSelectors( 'reducer1', {
			selector1,
			selector2,
		} );

		expect( select( 'reducer1' ).selector1() ).toEqual( 'result1' );
		expect( selector1 ).toBeCalledWith( store.getState() );

		expect( select( 'reducer1' ).selector2() ).toEqual( 'result2' );
		expect( selector2 ).toBeCalledWith( store.getState() );
	} );

	it( 'provides upgrade path for deprecated usage', () => {
		const store = registerReducer( 'reducer', () => 'state' );
		const selector = jest.fn( () => 'result' );

		registerSelectors( 'reducer', { selector } );

		expect( select( 'reducer', 'selector', 'arg' ) ).toEqual( 'result' );
		expect( selector ).toBeCalledWith( store.getState(), 'arg' );
		expect( console ).toHaveWarned();
	} );
} );

describe( 'query', () => {
	it( 'passes the relevant data to the component', () => {
		registerReducer( 'reactReducer', () => ( { reactKey: 'reactState' } ) );
		registerSelectors( 'reactReducer', {
			reactSelector: ( state, key ) => state[ key ],
		} );
		const Component = query( ( selectFunc, ownProps ) => {
			return {
				data: selectFunc( 'reactReducer' ).reactSelector( ownProps.keyName ),
			};
		} )( ( props ) => {
			return <div>{ props.data }</div>;
		} );

		const tree = render( <Component keyName="reactKey" /> );

		expect( tree ).toMatchSnapshot();
	} );
} );

describe( 'subscribe', () => {
	it( 'registers multiple selectors to the public API', () => {
		let incrementedValue = null;
		const store = registerReducer( 'myAwesomeReducer', ( state = 0 ) => state + 1 );
		registerSelectors( 'myAwesomeReducer', {
			globalSelector: ( state ) => state,
		} );
		const unsubscribe = subscribe( () => {
			incrementedValue = select( 'myAwesomeReducer' ).globalSelector();
		} );
		const action = { type: 'dummy' };

		store.dispatch( action ); // increment the data by => data = 2
		expect( incrementedValue ).toBe( 2 );

		store.dispatch( action ); // increment the data by => data = 3
		expect( incrementedValue ).toBe( 3 );

		unsubscribe(); // Store subscribe to changes, the data variable stops upgrading.

		store.dispatch( action );
		store.dispatch( action );

		expect( incrementedValue ).toBe( 3 );
	} );
} );
