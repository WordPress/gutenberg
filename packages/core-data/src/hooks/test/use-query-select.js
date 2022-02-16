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
import { act, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useQuerySelect from '../use-query-select';

describe( 'useQuerySelect', () => {
	let registry;
	beforeEach( () => {
		jest.useFakeTimers();

		registry = createRegistry();
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				getFoo: ( state ) => state.foo,
				testSelector: ( state, key ) => state[ key ],
			},
		} );
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
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
		const testInstance = render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" />
			</RegistryProvider>
		);
		// 2 times expected
		// - 1 for initial mount
		// - 1 for after mount before subscription set.
		expect( selectSpy ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );

		// ensure expected state was rendered
		expect( testInstance.findByText( 'bar' ) ).toBeTruthy();
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
		expect( selectors ).toHaveLength( 4 );
		expect( selectors[ 0 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 0 ] ).toBe( selectors[ 1 ] );
		expect( selectors[ 1 ] ).toBe( selectors[ 2 ] );

		// Re-render
		render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="bar" />
			</RegistryProvider>
		);

		// ensure we still got the memoized results after re-rendering
		expect( selectors ).toHaveLength( 8 );
		expect( selectors[ 3 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 5 ] ).toBe( selectors[ 6 ] );
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
			status: 'IDLE',
		} );
	} );

	it( 'returns the expected "response" details – resolvers and arguments', async () => {
		registry.register(
			createReduxStore( 'resolverStore', {
				__experimentalUseThunks: true,
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
					getResolvedFoo: () => ( { dispatch } ) =>
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
			status: 'IDLE',
		} );

		await act( async () => {
			jest.advanceTimersToNextTimer();
		} );

		// Re-render, expect resolved data
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( querySelectData ).toEqual( {
			data: 15,
			isResolving: false,
			hasResolved: true,
			status: 'SUCCESS',
		} );
	} );
} );
