/**
 * WordPress dependencies
 */
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';

/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useQuerySelect from '../use-query-select';

/* eslint-disable @wordpress/wp-global-usage */
describe( 'useQuerySelect', () => {
	const initialScriptDebug = globalThis.SCRIPT_DEBUG;
	let registry;

	beforeAll( () => {
		// Do not run hook in development mode; it will call `mapSelect` an extra time.
		globalThis.SCRIPT_DEBUG = false;
	} );

	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				getFoo: ( state ) => state.foo,
				testSelector: ( state, key ) => state[ key ],
			},
		} );
	} );

	afterAll( () => {
		globalThis.SCRIPT_DEBUG = initialScriptDebug;
	} );

	const getTestComponent = ( mapSelectSpy, dependencyKey ) => ( props ) => {
		const dependencies = props[ dependencyKey ];
		mapSelectSpy.mockImplementation( ( select ) => ( {
			results: select( 'testStore' ).testSelector( props.keyName ),
		} ) );
		const data = useQuerySelect( mapSelectSpy, [ dependencies ] );
		return <div>{ data.results.data }</div>;
	};

	it( 'passes the relevant data to the component', () => {
		const selectSpy = jest.fn();
		const TestComponent = jest
			.fn()
			.mockImplementation( getTestComponent( selectSpy, 'keyName' ) );
		render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" />
			</RegistryProvider>
		);

		expect( selectSpy ).toHaveBeenCalledTimes( 1 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// ensure expected state was rendered
		expect( screen.getByText( 'bar' ) ).toBeInTheDocument();
	} );

	it( 'uses memoized selectors', () => {
		const selectors = [];
		const TestComponent = jest.fn().mockImplementation( ( props ) => {
			useQuerySelect(
				function ( query ) {
					selectors.push( query( 'testStore' ) );
					selectors.push( query( 'testStore' ) );
					return null;
				},
				[ props.keyName ]
			);
			return <div />;
		} );

		render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" />
			</RegistryProvider>
		);

		// ensure the selectors were properly memoized
		expect( selectors ).toHaveLength( 2 );
		expect( selectors[ 0 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 0 ] ).toBe( selectors[ 1 ] );

		// Re-render
		render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="bar" />
			</RegistryProvider>
		);

		// ensure we still got the memoized results after re-rendering
		expect( selectors ).toHaveLength( 4 );
		expect( selectors[ 2 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 1 ] ).toBe( selectors[ 2 ] );
		expect( selectors[ 2 ] ).toBe( selectors[ 3 ] );
	} );

	it( 'returns the expected "response" details – no resolvers and arguments', () => {
		let querySelectData;
		const TestComponent = jest.fn().mockImplementation( () => {
			querySelectData = useQuerySelect( function ( query ) {
				return query( 'testStore' ).getFoo();
			}, [] );
			return <div />;
		} );

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( querySelectData ).toEqual( {
			data: 'bar',
			isResolving: false,
			hasResolved: false,
			hasStarted: false,
			status: 'IDLE',
		} );
	} );

	it( 'returns the expected "response" details – resolvers and arguments', async () => {
		registry.register(
			createReduxStore( 'resolverStore', {
				reducer: ( state = { resolvedFoo: 0 }, action ) => {
					if ( action?.type === 'RECEIVE_FOO' ) {
						return { ...state, resolvedFoo: action.value };
					}
					return state;
				},
				actions: {
					receiveFoo: ( value ) => ( {
						type: 'RECEIVE_FOO',
						value,
					} ),
				},
				resolvers: {
					getResolvedFoo:
						() =>
						( { dispatch } ) =>
							dispatch.receiveFoo( 5 ),
				},
				selectors: {
					getResolvedFoo: ( state, arg ) => state.resolvedFoo + arg,
				},
			} )
		);

		let querySelectData;
		const TestComponent = jest.fn().mockImplementation( () => {
			querySelectData = useQuerySelect( function ( query ) {
				return query( 'resolverStore' ).getResolvedFoo( 10 );
			}, [] );
			return <div />;
		} );

		// Initial render, expect default values
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( querySelectData ).toEqual( {
			data: 10,
			isResolving: false,
			hasResolved: false,
			hasStarted: false,
			status: 'IDLE',
		} );

		// Re-render, expect resolved data
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await waitFor( () =>
			expect( querySelectData ).toEqual( {
				data: 15,
				isResolving: false,
				hasResolved: true,
				hasStarted: true,
				status: 'SUCCESS',
			} )
		);
	} );
} );
/* eslint-enable @wordpress/wp-global-usage */
