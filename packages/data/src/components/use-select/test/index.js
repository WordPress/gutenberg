/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';
import useSelect from '../index';

describe( 'useSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	const getTestComponent = ( mapSelectSpy, dependencyKey ) => ( props ) => {
		const dependencies = props[ dependencyKey ];
		mapSelectSpy.mockImplementation( ( select ) => ( {
			results: select( 'testStore' ).testSelector( props.keyName ),
		} ) );
		const data = useSelect( mapSelectSpy, [ dependencies ] );
		return <div>{ data.results }</div>;
	};

	it( 'passes the relevant data to the component', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );
		const selectSpy = jest.fn();
		const TestComponent = jest
			.fn()
			.mockImplementation( getTestComponent( selectSpy, 'keyName' ) );
		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="foo" />
				</RegistryProvider>
			);
		} );
		const testInstance = renderer.root;
		// 2 times expected
		// - 1 for initial mount
		// - 1 for after mount before subscription set.
		expect( selectSpy ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'bar',
		} );
	} );

	it( 'uses memoized selector if dependencies do not change', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		const selectSpyFoo = jest.fn().mockImplementation( () => 'foo' );
		const selectSpyBar = jest.fn().mockImplementation( () => 'bar' );
		const TestComponent = jest.fn().mockImplementation( ( props ) => {
			const mapSelect = props.change ? selectSpyFoo : selectSpyBar;
			const data = useSelect( mapSelect, [ props.keyName ] );
			return <div>{ data }</div>;
		} );
		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="foo" change={ true } />
				</RegistryProvider>
			);
		} );
		const testInstance = renderer.root;

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 2 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 0 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'foo',
		} );

		//rerender with non dependency changed
		act( () => {
			renderer.update(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="foo" change={ false } />
				</RegistryProvider>
			);
		} );

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 2 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 0 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'foo',
		} );

		// rerender with dependency changed
		// rerender with non dependency changed
		act( () => {
			renderer.update(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="bar" change={ false } />
				</RegistryProvider>
			);
		} );

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 2 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 1 );
		expect( TestComponent ).toHaveBeenCalledTimes( 3 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'bar',
		} );
	} );
	describe( 'rerenders as expected with various mapSelect return types', () => {
		const getComponent = ( mapSelectSpy ) => () => {
			const data = useSelect( mapSelectSpy, [] );
			return <div data={ data } />;
		};
		let subscribedSpy, TestComponent;
		const mapSelectSpy = jest.fn( ( select ) =>
			select( 'testStore' ).testSelector()
		);
		const selectorSpy = jest.fn();
		const subscribeCallback = ( subscription ) => {
			subscribedSpy = subscription;
		};

		beforeEach( () => {
			registry.registerStore( 'testStore', {
				reducer: () => null,
				selectors: {
					testSelector: selectorSpy,
				},
			} );
			registry.subscribe = subscribeCallback;
			TestComponent = getComponent( mapSelectSpy );
		} );
		afterEach( () => {
			selectorSpy.mockClear();
			mapSelectSpy.mockClear();
		} );

		it.each( [
			[ 'boolean', [ false, true ] ],
			[ 'number', [ 10, 20 ] ],
			[ 'string', [ 'bar', 'cheese' ] ],
			[
				'array',
				[
					[ 10, 20 ],
					[ 10, 30 ],
				],
			],
			[ 'object', [ { foo: 'bar' }, { foo: 'cheese' } ] ],
			[ 'null', [ null, undefined ] ],
			[ 'undefined', [ undefined, 42 ] ],
		] )(
			'renders as expected with %s return values',
			( type, testValues ) => {
				const [ valueA, valueB ] = testValues;
				selectorSpy.mockReturnValue( valueA );
				let renderer;
				act( () => {
					renderer = TestRenderer.create(
						<RegistryProvider value={ registry }>
							<TestComponent />
						</RegistryProvider>
					);
				} );
				const testInstance = renderer.root;
				// ensure expected state was rendered.
				expect( testInstance.findByType( 'div' ).props.data ).toEqual(
					valueA
				);

				// Update the returned value from the selector and trigger the
				// subscription which should in turn trigger a re-render.
				act( () => {
					selectorSpy.mockReturnValue( valueB );
					subscribedSpy();
				} );
				expect( testInstance.findByType( 'div' ).props.data ).toEqual(
					valueB
				);
				expect( mapSelectSpy ).toHaveBeenCalledTimes( 3 );
			}
		);
	} );

	it( 'uses memoized selector if dependent stores do not change', async () => {
		const storeConfig = {
			actions: {
				increment: () => ( { type: 'INCREMENT' } ),
			},
			reducer: ( state, action ) => {
				if ( ! state ) {
					return { counter: 0 };
				}
				if ( action?.type === 'INCREMENT' ) {
					return { counter: state.counter + 1 };
				}
				return state;
			},
			selectors: {
				getCounter: ( state ) => state.counter,
			},
		};
		registry.registerStore( 'store-1', storeConfig );
		registry.registerStore( 'store-2', storeConfig );

		const selectSpyFoo = jest
			.fn()
			.mockImplementation( () =>
				registry.select( 'store-1' ).getCounter()
			);
		const TestComponent = jest.fn().mockImplementation( () => {
			const data = useSelect( selectSpyFoo, [], [ 'store-1' ] );
			return <div>{ 'Counter: ' + data }</div>;
		} );
		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="foo" change={ true } />
				</RegistryProvider>
			);
		} );
		const testInstance = renderer.root;

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'Counter: 0',
		} );

		// update related store
		act( () => {
			registry.dispatch( 'store-1' ).increment();
		} );
		// ensure the selector was recomputed
		expect( selectSpyFoo ).toHaveBeenCalledTimes( 3 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'Counter: 1',
		} );

		// update unrelated store
		act( () => {
			registry.dispatch( 'store-2' ).increment();
		} );
		// ensure the selector was not recomputed
		expect( selectSpyFoo ).toHaveBeenCalledTimes( 3 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'Counter: 1',
		} );
	} );
} );
