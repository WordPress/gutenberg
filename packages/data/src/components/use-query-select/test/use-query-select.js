/**
 * WordPress dependencies
 */
import { createReduxStore } from '@wordpress/data';

/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';
import useQuerySelect from '../index';

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

	const actRender = ( component ) => {
		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					{ component }
				</RegistryProvider>
			);
		} );
		return renderer;
	};

	it( 'passes the relevant data to the component', () => {
		const selectSpy = jest.fn();
		const TestComponent = jest
			.fn()
			.mockImplementation( getTestComponent( selectSpy, 'keyName' ) );
		const renderer = actRender( <TestComponent keyName="foo" /> );
		const testInstance = renderer.root;
		// 2 times expected
		// - 1 for initial mount
		// - 1 for after mount before subscription set.
		expect( selectSpy ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'bar',
		} );
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
		actRender( <TestComponent keyName="foo" /> );

		// ensure the selectors were properly memoized
		expect( selectors ).toHaveLength( 4 );
		expect( selectors[ 0 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 0 ] ).toBe( selectors[ 1 ] );
		expect( selectors[ 1 ] ).toBe( selectors[ 2 ] );

		// Re-render
		actRender( <TestComponent keyName="bar" /> );

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

		actRender( <TestComponent /> );

		expect( querySelectData ).toEqual( {
			data: 'bar',
			isResolving: false,
			hasStarted: false,
			hasResolved: false,
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
		act( () => {
			TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);
		} );
		expect( querySelectData ).toEqual( {
			data: 10,
			isResolving: false,
			hasStarted: false,
			hasResolved: false,
		} );

		await act( async () => {
			jest.advanceTimersToNextTimer();
		} );

		// Re-render, expect resolved data
		actRender( <TestComponent /> );
		expect( querySelectData ).toEqual( {
			data: 15,
			isResolving: false,
			hasStarted: true,
			hasResolved: true,
		} );
	} );
} );
