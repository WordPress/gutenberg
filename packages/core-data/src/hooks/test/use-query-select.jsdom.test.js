import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
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

	function renderHookWithRegistry( hook, options = {} ) {
		const Wrapper = ( { children } ) =>
			createElement( RegistryProvider, { value: registry }, children );
		return renderHook( hook, { wrapper: Wrapper, ...options } );
	}

	it( 'passes the relevant data to the hook', () => {
		const renderSpy = jest.fn();
		const selectSpy = jest.fn();

		const { result } = renderHookWithRegistry( () => {
			renderSpy();
			selectSpy.mockImplementation( ( select ) => ( {
				results: select( 'testStore' ).testSelector( 'foo' ),
			} ) );
			return useQuerySelect( selectSpy, [ 'foo' ] );
		} );

		expect( selectSpy ).toHaveBeenCalledTimes( 1 );
		expect( renderSpy ).toHaveBeenCalledTimes( 1 );

		// ensure the expected state was returned
		expect( result.current.results.data ).toBe( 'bar' );
	} );

	it( 'uses memoized selectors', () => {
		const selectors = [];
		const mapSelect = ( query ) => {
			selectors.push( query( 'testStore' ) );
			selectors.push( query( 'testStore' ) );
			return null;
		};

		renderHookWithRegistry(
			( { keyName } ) => useQuerySelect( mapSelect, [ keyName ] ),
			{ initialProps: { keyName: 'foo' } }
		);

		// ensure the selectors were properly memoized
		expect( selectors ).toHaveLength( 2 );
		expect( selectors[ 0 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 0 ] ).toBe( selectors[ 1 ] );

		// Re-render
		renderHookWithRegistry(
			( { keyName } ) => useQuerySelect( mapSelect, [ keyName ] ),
			{ initialProps: { keyName: 'bar' } }
		);

		// ensure we still got the memoized results after re-rendering
		expect( selectors ).toHaveLength( 4 );
		expect( selectors[ 2 ] ).toHaveProperty( 'testSelector' );
		expect( selectors[ 1 ] ).toBe( selectors[ 2 ] );
		expect( selectors[ 2 ] ).toBe( selectors[ 3 ] );
	} );

	it( 'returns the expected "response" details – no resolvers and arguments', () => {
		const { result } = renderHookWithRegistry( () =>
			useQuerySelect( ( query ) => query( 'testStore' ).getFoo(), [] )
		);

		expect( result.current ).toEqual( {
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

		const renderResolvedFoo = () =>
			renderHookWithRegistry( () =>
				useQuerySelect(
					( query ) => query( 'resolverStore' ).getResolvedFoo( 10 ),
					[]
				)
			);

		// Initial render, expect default values
		expect( renderResolvedFoo().result.current ).toEqual( {
			data: 10,
			isResolving: false,
			hasResolved: false,
			hasStarted: false,
			status: 'IDLE',
		} );

		// Re-render, expect resolved data
		const { result } = renderResolvedFoo();

		await waitFor( () =>
			expect( result.current ).toEqual( {
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
