/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { registerReducer, registerSelectors, select, query } from '../';

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

		expect( select( 'reducer1', 'selector1' ) ).toEqual( 'result1' );
		expect( selector1 ).toBeCalledWith( store.getState() );

		expect( select( 'reducer1', 'selector2' ) ).toEqual( 'result2' );
		expect( selector2 ).toBeCalledWith( store.getState() );
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
				data: selectFunc( 'reactReducer', 'reactSelector', ownProps.keyName ),
			};
		} )( ( props ) => {
			return <div>{ props.data }</div>;
		} );

		const tree = render( <Component keyName="reactKey" /> );

		expect( tree ).toMatchSnapshot();
	} );
} );
