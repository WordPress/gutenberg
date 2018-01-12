import { registerReducer, registerSelector, registerSelectors, selectors, query } from '@wordpress/data';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';

describe( 'store', () => {
	it( 'appends reducers to the state', () => {
		const reducer1 = () => 'chicken';
		const reducer2 = () => 'ribs';

		const store = registerReducer( 'red1', reducer1 );
		expect( store.getState() ).toEqual( 'chicken' );

		const store2 = registerReducer( 'red2', reducer2 );
		expect( store2.getState() ).toEqual( 'ribs' );
	} );

	describe( 'registerSelector', () => {
		it( 'adds selectors to the public API', () => {
			const store = registerReducer( 'reducer1', () => 'state1' );
			const func = jest.fn( () => {
				return 'result1';
			} );

			registerSelector( 'reducer1', 'selector1', func );

			expect( selectors.reducer1.selector1() ).toEqual( 'result1' );
			expect( func ).toBeCalledWith( store.getState() );
		} );
	} );

	describe( 'registerSelectors', () => {
		it( 'registers multiple selectors to the public API', () => {
			const store = registerReducer( 'reducer1', () => 'state1' );
			const selector1 = jest.fn( () => 'result1' );
			const selector2 = jest.fn( () => 'result2' );

			registerSelectors( 'reducer1', {
				selector1,
				selector2,
			} );

			expect( selectors.reducer1.selector1() ).toEqual( 'result1' );
			expect( selector1 ).toBeCalledWith( store.getState() );

			expect( selectors.reducer1.selector2() ).toEqual( 'result2' );
			expect( selector2 ).toBeCalledWith( store.getState() );
		} );
	} );

	describe( 'query', () => {
		it( 'passes the relevant data to the component', () => {
			const store = registerReducer( 'reactReducer', () => 'reactState' );
			registerSelector( 'reactReducer', 'reactSelector', state => state );
			const Component = query( ( scopedSelectors ) => {
				return {
					data: scopedSelectors.reactReducer.reactSelector(),
				};
			} )( ( props ) => {
				return <div>{ props.data }</div>;
			} );

			const tree = renderer.create( <Provider store={ store }><Component /></Provider> );

			expect( tree ).toMatchSnapshot();
		} );
	} );
} );
