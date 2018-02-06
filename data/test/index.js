/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
let registerReducer, registerSelectors, select, query, subscribe;

const loadModule = () => {
	const module = require( '../' );
	registerReducer = module.registerReducer;
	registerSelectors = module.registerSelectors;
	select = module.select;
	query = module.query;
	subscribe = module.subscribe;
};

/**
 * Make sure every test is ran with a fresh data/index.js module.
 */
beforeEach( () => {
	jest.resetModules();
	loadModule();
} );

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

	it( 'prints an error when a selector is called on a non-existing reducer', () => {
		/* eslint-disable no-console */
		const originalConsoleError = console.error;
		console.error = jest.fn( () => {} );

		expect( select( 'reducer1', 'selector1' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalled();

		console.error = originalConsoleError;
		/* eslint-enable no-console */
	} );

	it( 'prints an error when a non-existing selector is called', () => {
		/* eslint-disable no-console */
		const originalConsoleError = console.error;
		console.error = jest.fn( () => {} );

		// Call register reducer to make sure the store is created.
		registerReducer( 'reducer1', () => 'state1' );

		expect( select( 'reducer1', 'selector1' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalled();

		console.error = originalConsoleError;
		/* eslint-enable no-console */
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

describe( 'subscribe', () => {
	it( 'registers multiple selectors to the public API', () => {
		let incrementedValue = null;
		const store = registerReducer( 'myAwesomeReducer', ( state = 0 ) => state + 1 );
		registerSelectors( 'myAwesomeReducer', {
			globalSelector: ( state ) => state,
		} );
		const unsubscribe = subscribe( () => {
			incrementedValue = select( 'myAwesomeReducer', 'globalSelector' );
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
