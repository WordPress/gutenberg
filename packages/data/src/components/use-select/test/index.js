/**
 * External dependencies
 */
import { act, render, fireEvent, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	createRegistry,
	createRegistrySelector,
	RegistryProvider,
	AsyncModeProvider,
} from '../../..';
import useSelect from '..';

function counterStore( initialCount = 0, step = 1 ) {
	return {
		reducer: ( state = initialCount, action ) =>
			action.type === 'INC' ? state + step : state,
		actions: {
			inc: () => ( { type: 'INC' } ),
		},
		selectors: {
			get: ( state ) => state,
		},
	};
}

/* eslint-disable @wordpress/wp-global-usage */
describe( 'useSelect', () => {
	const initialScriptDebug = globalThis.SCRIPT_DEBUG;
	let registry;

	beforeAll( () => {
		// Do not run hook in development mode; it will call `mapSelect` an extra time.
		globalThis.SCRIPT_DEBUG = false;
	} );

	beforeEach( () => {
		registry = createRegistry();
	} );

	afterAll( () => {
		globalThis.SCRIPT_DEBUG = initialScriptDebug;
	} );

	it( 'passes the relevant data to the component', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		const selectSpy = jest.fn();
		const TestComponent = jest.fn( ( props ) => {
			selectSpy.mockImplementation( ( select ) => ( {
				results: select( 'testStore' ).testSelector( props.keyName ),
			} ) );
			const data = useSelect( selectSpy, [ props.keyName ] );
			return <div role="status">{ data.results }</div>;
		} );

		render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" />
			</RegistryProvider>
		);

		expect( selectSpy ).toHaveBeenCalledTimes( 1 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// Ensure expected state was rendered.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'bar' );
	} );

	it( 'uses memoized selector if dependencies do not change', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		const selectSpyFoo = jest.fn( () => 'foo' );
		const selectSpyBar = jest.fn( () => 'bar' );
		const TestComponent = jest.fn( ( props ) => {
			const mapSelect = props.change ? selectSpyFoo : selectSpyBar;
			const data = useSelect( mapSelect, [ props.keyName ] );
			return <div role="status">{ data }</div>;
		} );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" change />
			</RegistryProvider>
		);

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 1 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 0 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );

		// Ensure expected state was rendered.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'foo' );

		// Rerender with non dependency changed.
		rerender(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="foo" change={ false } />
			</RegistryProvider>
		);

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 1 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 0 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );

		// Ensure expected state was rendered.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'foo' );

		// Rerender with dependency changed.
		rerender(
			<RegistryProvider value={ registry }>
				<TestComponent keyName="bar" change={ false } />
			</RegistryProvider>
		);

		expect( selectSpyFoo ).toHaveBeenCalledTimes( 1 );
		expect( selectSpyBar ).toHaveBeenCalledTimes( 1 );
		expect( TestComponent ).toHaveBeenCalledTimes( 3 );

		// Ensure expected state was rendered.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'bar' );
	} );

	it( 'does not rerender a nested component that is to be unmounted', () => {
		registry.registerStore( 'toggler', {
			reducer: ( state = false, action ) =>
				action.type === 'TOGGLE' ? ! state : state,
			actions: {
				toggle: () => ( { type: 'TOGGLE' } ),
			},
			selectors: {
				get: ( state ) => state,
			},
		} );

		const mapSelect = ( select ) => select( 'toggler' ).get();

		const mapSelectChild = jest.fn( mapSelect );
		const Child = jest.fn( () => {
			const show = useSelect( mapSelectChild, [] );
			return show ? 'yes' : 'no';
		} );

		const mapSelectParent = jest.fn( mapSelect );
		const Parent = jest.fn( () => {
			const show = useSelect( mapSelectParent, [] );
			return show ? <Child /> : 'none';
		} );

		render(
			<RegistryProvider value={ registry }>
				<Parent />
			</RegistryProvider>
		);

		// Initial render renders only parent and subscribes the parent to store.
		expect( screen.getByText( 'none' ) ).toBeInTheDocument();
		expect( mapSelectParent ).toHaveBeenCalledTimes( 1 );
		expect( mapSelectChild ).toHaveBeenCalledTimes( 0 );
		expect( Parent ).toHaveBeenCalledTimes( 1 );
		expect( Child ).toHaveBeenCalledTimes( 0 );

		act( () => {
			registry.dispatch( 'toggler' ).toggle();
		} );

		// Child was rendered and subscribed to the store, as the _second_ subscription.
		expect( screen.getByText( 'yes' ) ).toBeInTheDocument();
		expect( mapSelectParent ).toHaveBeenCalledTimes( 2 );
		expect( mapSelectChild ).toHaveBeenCalledTimes( 1 );
		expect( Parent ).toHaveBeenCalledTimes( 2 );
		expect( Child ).toHaveBeenCalledTimes( 1 );

		act( () => {
			registry.dispatch( 'toggler' ).toggle();
		} );

		// Check that child was unmounted without any extra state update being performed on it.
		// I.e., `mapSelectChild` was called again, and state update was scheduled, we cannot
		// avoid that, but the state update is never executed and doesn't do a rerender.
		expect( screen.getByText( 'none' ) ).toBeInTheDocument();
		expect( mapSelectParent ).toHaveBeenCalledTimes( 3 );
		expect( mapSelectChild ).toHaveBeenCalledTimes( 2 );
		expect( Parent ).toHaveBeenCalledTimes( 3 );
		expect( Child ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'incrementally subscribes to newly selected stores', () => {
		registry.registerStore( 'store-main', counterStore() );
		registry.registerStore( 'store-even', counterStore( 0, 2 ) );
		registry.registerStore( 'store-odd', counterStore( 1, 2 ) );

		const mapSelect = jest.fn( ( select ) => {
			const first = select( 'store-main' ).get();
			// select from other stores depending on whether main value is even or odd
			const secondStore = first % 2 === 1 ? 'store-odd' : 'store-even';
			const second = select( secondStore ).get();
			return first + ':' + second;
		} );

		const TestComponent = jest.fn( () => {
			const data = useSelect( mapSelect, [] );
			return <div role="status">{ data }</div>;
		} );

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( mapSelect ).toHaveBeenCalledTimes( 1 );
		expect( TestComponent ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0:0' );

		// check that increment in store-even triggers a render
		act( () => {
			registry.dispatch( 'store-even' ).inc();
		} );

		expect( mapSelect ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0:2' );

		// check that increment in store-odd doesn't trigger a render (not listening yet)
		act( () => {
			registry.dispatch( 'store-odd' ).inc();
		} );

		expect( mapSelect ).toHaveBeenCalledTimes( 2 );
		expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0:2' );

		// check that increment in main store switches to store-odd
		act( () => {
			registry.dispatch( 'store-main' ).inc();
		} );

		expect( mapSelect ).toHaveBeenCalledTimes( 3 );
		expect( TestComponent ).toHaveBeenCalledTimes( 3 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1:3' );

		// check that increment in store-odd triggers a render
		act( () => {
			registry.dispatch( 'store-odd' ).inc();
		} );

		expect( mapSelect ).toHaveBeenCalledTimes( 4 );
		expect( TestComponent ).toHaveBeenCalledTimes( 4 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1:5' );

		// check that increment in store-even triggers a mapSelect call (still listening)
		// but not a render (not used for selected value which doesn't change)
		act( () => {
			registry.dispatch( 'store-even' ).inc();
		} );

		expect( mapSelect ).toHaveBeenCalledTimes( 5 );
		expect( TestComponent ).toHaveBeenCalledTimes( 4 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1:5' );
	} );

	describe( 'rerenders as expected with various mapSelect return types', () => {
		const getComponent = ( mapSelectSpy ) => () => {
			const data = useSelect( mapSelectSpy, [] );
			return <div role="status" data-d={ JSON.stringify( data ) } />;
		};

		let TestComponent;
		const mapSelectSpy = jest.fn( ( select ) =>
			select( 'testStore' ).testSelector()
		);
		const selectorSpy = jest.fn();

		beforeEach( () => {
			registry.registerStore( 'testStore', {
				actions: {
					forceUpdate: () => ( { type: 'FORCE_UPDATE' } ),
				},
				reducer: ( state = {} ) => ( { ...state } ),
				selectors: {
					testSelector: selectorSpy,
				},
			} );
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
				render(
					<RegistryProvider value={ registry }>
						<TestComponent />
					</RegistryProvider>
				);
				// Ensure expected state was rendered.
				expect( screen.getByRole( 'status' ).dataset.d ).toBe(
					JSON.stringify( valueA )
				);

				// Update the returned value from the selector and trigger the
				// subscription which should in turn trigger a re-render.
				act( () => {
					selectorSpy.mockReturnValue( valueB );
					registry.dispatch( 'testStore' ).forceUpdate();
				} );
				expect( screen.getByRole( 'status' ).dataset.d ).toBe(
					JSON.stringify( valueB )
				);
				expect( mapSelectSpy ).toHaveBeenCalledTimes( 2 );
			}
		);
	} );

	describe( 're-calls the selector as few times as possible', () => {
		it( 'only calls the selectors it has selected', () => {
			registry.registerStore( 'store-1', counterStore() );
			registry.registerStore( 'store-2', counterStore() );

			const selectCount1 = jest.fn();
			const selectCount2 = jest.fn();

			const TestComponent = jest.fn( () => {
				const count1 = useSelect(
					( select ) => selectCount1() || select( 'store-1' ).get(),
					[]
				);
				useSelect(
					( select ) => selectCount2() || select( 'store-2' ).get(),
					[]
				);

				return <div role="status">{ count1 }</div>;
			} );

			const { unmount } = render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( selectCount1 ).toHaveBeenCalledTimes( 1 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 1 );
			expect( TestComponent ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			act( () => {
				registry.dispatch( 'store-2' ).inc();
			} );

			expect( selectCount1 ).toHaveBeenCalledTimes( 1 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			act( () => {
				registry.dispatch( 'store-1' ).inc();
			} );

			expect( selectCount1 ).toHaveBeenCalledTimes( 2 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 3 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// Test if the unsubscribers get called correctly.
			expect( () => unmount() ).not.toThrow();
		} );

		it( 'can subscribe to multiple stores at once', () => {
			registry.registerStore( 'store-1', counterStore() );
			registry.registerStore( 'store-2', counterStore() );
			registry.registerStore( 'store-3', counterStore() );

			const selectCount1And2 = jest.fn();

			const TestComponent = jest.fn( () => {
				const { count1, count2 } = useSelect(
					( select ) =>
						selectCount1And2() || {
							count1: select( 'store-1' ).get(),
							count2: select( 'store-2' ).get(),
						},
					[]
				);

				return (
					<div role="status">
						{ count1 },{ count2 }
					</div>
				);
			} );

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( selectCount1And2 ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0,0' );

			act( () => {
				registry.dispatch( 'store-2' ).inc();
			} );

			expect( selectCount1And2 ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0,1' );

			act( () => {
				registry.dispatch( 'store-3' ).inc();
			} );

			expect( selectCount1And2 ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0,1' );
		} );

		it( 're-calls the selector when deps changed', () => {
			registry.registerStore( 'store-1', counterStore() );
			registry.registerStore( 'store-2', counterStore() );
			registry.registerStore( 'store-3', counterStore() );

			let dep, setDep;
			const selectCount1AndDep = jest.fn();

			const TestComponent = jest.fn( () => {
				[ dep, setDep ] = useState( 0 );
				const state = useSelect(
					( select ) =>
						selectCount1AndDep() || {
							count1: select( 'store-1' ).get(),
							dep,
						},
					[ dep ]
				);

				return (
					<div role="status">
						count:{ state.count1 },dep:{ state.dep }
					</div>
				);
			} );

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( selectCount1AndDep ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count:0,dep:0'
			);

			act( () => {
				setDep( 1 );
			} );

			expect( selectCount1AndDep ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count:0,dep:1'
			);

			act( () => {
				registry.dispatch( 'store-1' ).inc();
			} );

			expect( selectCount1AndDep ).toHaveBeenCalledTimes( 3 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count:1,dep:1'
			);
		} );

		it( 'captures state changes scheduled between render and subscription', () => {
			registry.registerStore( 'store-1', counterStore() );

			const selectCount1 = jest.fn( ( select ) => ( {
				count1: select( 'store-1' ).get(),
			} ) );

			const TestComponent = jest.fn( () => {
				const { count1 } = useSelect( selectCount1, [] );

				// Increment the store value from 0 to 1 after render and before subscription
				useLayoutEffect( () => {
					if ( count1 === 0 ) {
						registry.dispatch( 'store-1' ).inc();
					}
				}, [ count1 ] );

				return <div role="status">count1:{ count1 }</div>;
			} );

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			// One select on initial render.
			// There's a second selector call on the second render, but that one returns a memoized value.
			expect( selectCount1 ).toHaveBeenCalledTimes( 2 );

			// Initial render and second render after counter increment (which is expected to be detected).
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );

			// Finally rendered with the incremented counter's value.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:1'
			);
		} );

		it( 'captures state changes scheduled between render and effect after selector change', () => {
			registry.registerStore( 'names', {
				reducer: ( state = {}, action ) => {
					if ( action.type === 'SET_NAME' ) {
						return {
							...state,
							[ action.id ]: action.name,
						};
					}
					return state;
				},
				actions: {
					setName: ( id, name ) => ( { type: 'SET_NAME', id, name } ),
				},
				selectors: {
					getName: ( state, id ) => state[ id ] ?? 'null',
				},
			} );

			const renderedItems = [];

			function TestComponent() {
				const [ blockId, setBlockId ] = useState( 1 );

				const name = useSelect(
					( select ) => select( 'names' ).getName( blockId ),
					[ blockId ]
				);

				// Change name of block 2. The store listener will still use the old selector
				// for block 1, because a new one will be stored by an effect a moment later,
				// but we're testing that it still won't miss the update, because one more check
				// will happen in that effect.
				useLayoutEffect( () => {
					if ( blockId === 2 ) {
						registry.dispatch( 'names' ).setName( 2, 'new2' );
					}
				}, [ blockId ] );

				renderedItems.push( name );

				return (
					<button onClick={ () => setBlockId( 2 ) }>
						change-block
					</button>
				);
			}

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);
			expect( renderedItems ).toEqual( [ 'null' ] );

			fireEvent.click( screen.getByRole( 'button' ) );
			// After click, there are two new renders:
			// 1. With of block 2, after state update of `blockId` from 1 to 2
			// 2. After dispatching an action to change 2's name to `new2`
			expect( renderedItems ).toEqual( [ 'null', 'null', 'new2' ] );
		} );

		it( 'handles registry selectors', () => {
			const getCount1And2 = createRegistrySelector(
				( select ) => ( state ) => ( {
					count1: state,
					count2: select( 'store-2' ).get(),
				} )
			);

			const store1Spec = counterStore();
			Object.assign( store1Spec.selectors, { getCount1And2 } );
			registry.registerStore( 'store-1', store1Spec );
			registry.registerStore( 'store-2', counterStore() );

			const selectCount1And2 = jest.fn();

			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) =>
						selectCount1And2() ||
						select( 'store-1' ).getCount1And2(),
					[]
				);

				return (
					<div role="status">
						count1:{ state.count1 },count2:{ state.count2 }
					</div>
				);
			} );

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( selectCount1And2 ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:0,count2:0'
			);

			act( () => {
				registry.dispatch( 'store-2' ).inc();
			} );

			expect( selectCount1And2 ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:0,count2:1'
			);
		} );

		it( 'handles conditional statements in selectors', () => {
			registry.registerStore( 'store-1', counterStore() );
			registry.registerStore( 'store-2', counterStore() );

			const selectCount1 = jest.fn();
			const selectCount2 = jest.fn();

			const TestComponent = jest.fn( () => {
				const [ shouldSelectCount1, toggle ] = useReducer(
					( should ) => ! should,
					false
				);
				const state = useSelect(
					( select ) => {
						if ( shouldSelectCount1 ) {
							selectCount1();
							return 'count1:' + select( 'store-1' ).get();
						}

						selectCount2();
						return 'count2:' + select( 'store-2' ).get();
					},
					[ shouldSelectCount1 ]
				);

				return (
					<>
						<div role="status">{ state }</div>
						<button onClick={ toggle }>Open</button>
					</>
				);
			} );

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( selectCount1 ).toHaveBeenCalledTimes( 0 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count2:0'
			);

			act( () => screen.getByText( 'Open' ).click() );

			expect( selectCount1 ).toHaveBeenCalledTimes( 1 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:0'
			);

			// Verify that the component subscribed to store-1 after selected from
			act( () => {
				registry.dispatch( 'store-1' ).inc();
			} );

			expect( selectCount1 ).toHaveBeenCalledTimes( 2 );
			expect( selectCount2 ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:1'
			);
		} );

		it( "handles subscriptions to the parent's stores", () => {
			registry.registerStore( 'parent-store', counterStore() );

			const subRegistry = createRegistry( {}, registry );
			subRegistry.registerStore( 'child-store', counterStore() );

			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) => ( {
						parentCount: select( 'parent-store' ).get(),
						childCount: select( 'child-store' ).get(),
					} ),
					[]
				);

				return (
					<div role="status">
						parent:{ state.parentCount },child:{ state.childCount }
					</div>
				);
			} );

			render(
				<RegistryProvider value={ registry }>
					<RegistryProvider value={ subRegistry }>
						<TestComponent />
					</RegistryProvider>
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'parent:0,child:0'
			);

			act( () => {
				registry.dispatch( 'parent-store' ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'parent:1,child:0'
			);
		} );

		it( 'handles non-existing stores', () => {
			registry.registerStore( 'store-1', counterStore() );

			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) => ( {
						count1: select( 'store-1' ).get(),
						count2: select( 'store-2' )?.get() ?? 'blank',
					} ),
					[]
				);

				return (
					<div role="status">
						count1:{ state.count1 },count2:{ state.count2 }
					</div>
				);
			} );

			const { unmount } = render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:0,count2:blank'
			);

			act( () => {
				registry.dispatch( 'store-1' ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'count1:1,count2:blank'
			);

			// Test if the unsubscribers get called correctly.
			expect( () => unmount() ).not.toThrow();
		} );

		it( 'handles registration of a non-existing store during rendering', () => {
			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) =>
						select( 'not-yet-registered-store' )?.get() ?? 'blank',
					[]
				);

				return <div role="status">{ state }</div>;
			} );

			const { unmount } = render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'blank' );

			act( () => {
				registry.registerStore(
					'not-yet-registered-store',
					counterStore()
				);
			} );

			// This is not ideal, but is the way it's working before and we want to prevent breaking changes.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'blank' );

			act( () => {
				registry.dispatch( 'not-yet-registered-store' ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// Test if the unsubscribers get called correctly.
			expect( () => unmount() ).not.toThrow();
		} );

		it( 'handles registration of a non-existing store of sub-registry during rendering', () => {
			const subRegistry = createRegistry( {}, registry );

			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) =>
						select( 'not-yet-registered-child-store' )?.get() ??
						'blank',
					[]
				);

				return <div role="status">{ state }</div>;
			} );

			const { unmount } = render(
				<RegistryProvider value={ registry }>
					<RegistryProvider value={ subRegistry }>
						<TestComponent />
					</RegistryProvider>
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'blank' );

			act( () => {
				registry.registerStore(
					'not-yet-registered-child-store',
					counterStore()
				);
			} );

			// This is not ideal, but is the way it's working before and we want to prevent breaking changes.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'blank' );

			act( () => {
				registry.dispatch( 'not-yet-registered-child-store' ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// Test if the unsubscribers get called correctly.
			expect( () => unmount() ).not.toThrow();
		} );

		it( 'handles custom generic stores without a unsubscribe function', () => {
			const customStore = {
				name: 'generic-store',
				instantiate() {
					let storeChanged = () => {};
					let counter = 0;

					const selectors = {
						get: () => counter,
					};

					const actions = {
						inc: () => {
							counter += 1;
							storeChanged();
						},
					};

					return {
						getSelectors() {
							return selectors;
						},
						getActions() {
							return actions;
						},
						subscribe( listener ) {
							storeChanged = listener;
						},
					};
				},
			};

			registry.register( customStore );

			const TestComponent = jest.fn( () => {
				const state = useSelect(
					( select ) => select( customStore ).get(),
					[]
				);

				return <div role="status">{ state }</div>;
			} );

			const { unmount } = render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			act( () => {
				registry.dispatch( customStore ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			expect( () => unmount() ).not.toThrow();
		} );
	} );

	describe( 'async mode', () => {
		beforeEach( () => {
			registry.registerStore( 'counter', counterStore() );
		} );

		it( 'renders with async mode', async () => {
			const selectSpy = jest.fn( ( select ) =>
				select( 'counter' ).get()
			);

			const TestComponent = jest.fn( () => {
				const count = useSelect( selectSpy, [] );
				return <div role="status">{ count }</div>;
			} );

			render(
				<AsyncModeProvider value>
					<RegistryProvider value={ registry }>
						<TestComponent />
					</RegistryProvider>
				</AsyncModeProvider>
			);

			// initial render
			expect( selectSpy ).toHaveBeenCalledTimes( 1 );
			expect( TestComponent ).toHaveBeenCalledTimes( 1 );

			// Ensure expected state was rendered.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			act( () => {
				registry.dispatch( 'counter' ).inc();
			} );

			// still not called right after increment
			expect( selectSpy ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			expect( await screen.findByText( 1 ) ).toBeInTheDocument();

			expect( selectSpy ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		} );

		// Tests render queue fixes done in https://github.com/WordPress/gutenberg/pull/19286
		it( 'catches updates while switching from async to sync', () => {
			const selectSpy = jest.fn( ( select ) =>
				select( 'counter' ).get()
			);

			const TestComponent = jest.fn( () => {
				const count = useSelect( selectSpy, [] );
				return <div role="status">{ count }</div>;
			} );

			const App = ( { async } ) => (
				<AsyncModeProvider value={ async }>
					<RegistryProvider value={ registry }>
						<TestComponent />
					</RegistryProvider>
				</AsyncModeProvider>
			);

			const { rerender } = render( <App async /> );

			// Ensure expected state was rendered.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			// Schedules an async update of the component.
			act( () => {
				registry.dispatch( 'counter' ).inc();
			} );

			// Ensure the async update wasn't processed yet.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			// Switch from async mode to sync.
			rerender( <App async={ false } /> );

			// Ensure the async update was flushed during the rerender.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// initial render + rerender with isAsync=false
			expect( selectSpy ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'cancels scheduled updates when mapSelect function changes', async () => {
			const selectA = jest.fn(
				( select ) => 'a:' + select( 'counter' ).get()
			);
			const selectB = jest.fn(
				( select ) => 'b:' + select( 'counter' ).get()
			);

			const TestComponent = jest.fn( ( { variant } ) => {
				const count = useSelect( variant === 'a' ? selectA : selectB, [
					variant,
				] );
				return <div role="status">{ count }</div>;
			} );

			const App = ( { variant } ) => (
				<AsyncModeProvider value>
					<RegistryProvider value={ registry }>
						<TestComponent variant={ variant } />
					</RegistryProvider>
				</AsyncModeProvider>
			);

			const { rerender } = render( <App variant="a" /> );

			// Ensure expected state was rendered.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'a:0' );

			// Schedules an async update of the component.
			act( () => {
				registry.dispatch( 'counter' ).inc();
			} );

			// Ensure the async update wasn't processed yet.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'a:0' );

			// Rerender with a prop change that causes dependency change.
			rerender( <App variant="b" /> );

			// Ensure the async update was flushed (cancelled) during the rerender.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'b:1' );

			// Give the async update time to run in case it wasn't cancelled
			await new Promise( setImmediate );

			expect( selectA ).toHaveBeenCalledTimes( 1 );
			expect( selectB ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'cancels scheduled updates when unmounting', async () => {
			const selectSpy = jest.fn( ( select ) =>
				select( 'counter' ).get()
			);

			const TestComponent = jest.fn( () => {
				const count = useSelect( selectSpy, [] );
				return <div role="status">{ count }</div>;
			} );

			const App = () => (
				<AsyncModeProvider value>
					<RegistryProvider value={ registry }>
						<TestComponent />
					</RegistryProvider>
				</AsyncModeProvider>
			);

			const { unmount } = render( <App /> );

			// Ensure expected state was rendered.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			// Schedules an async update of the component.
			act( () => {
				registry.dispatch( 'counter' ).inc();
			} );

			// Ensure the async update wasn't processed yet.
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			// Unmount
			unmount();

			// Give the async update time to run in case it wasn't cancelled
			await new Promise( setImmediate );

			// only the initial render, no state updates
			expect( selectSpy ).toHaveBeenCalledTimes( 1 );
			expect( TestComponent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'cancels scheduled updates when registry changes', async () => {
			const registry2 = createRegistry();
			registry2.registerStore( 'counter', counterStore( 100 ) );

			const selectSpy = jest.fn( ( select ) =>
				select( 'counter' ).get()
			);

			const TestComponent = jest.fn( () => {
				const count = useSelect( selectSpy, [] );
				return <div role="status">{ count }</div>;
			} );

			const App = ( { reg } ) => (
				<AsyncModeProvider value>
					<RegistryProvider value={ reg }>
						<TestComponent />
					</RegistryProvider>
				</AsyncModeProvider>
			);

			const { rerender } = render( <App reg={ registry } /> );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			act( () => {
				registry.dispatch( 'counter' ).inc();
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '0' );

			rerender( <App reg={ registry2 } /> );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '100' );

			// Give the async update time to run in case it wasn't cancelled
			await new Promise( setImmediate );

			// initial render + registry change rerender, no state updates
			expect( selectSpy ).toHaveBeenCalledTimes( 2 );
			expect( TestComponent ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'usage without dependencies array', () => {
		it( 'does not memoize the callback when there are no deps', () => {
			registry.registerStore( 'store', counterStore( 1 ) );

			const Status = ( { multiple } ) => {
				const count = useSelect(
					( select ) => select( 'store' ).get() * multiple
				);
				return <div role="status">{ count }</div>;
			};

			const App = ( { multiple } ) => (
				<RegistryProvider value={ registry }>
					<Status multiple={ multiple } />
				</RegistryProvider>
			);

			const { rerender } = render( <App multiple={ 1 } /> );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// Check that the most recent value of `multiple` is used to render:
			// the old callback wasn't memoized and there is no stale closure problem.
			rerender( <App multiple={ 2 } /> );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '2' );
		} );

		it( 'resubscribes when the set of selected stores changes', () => {
			registry.registerStore( 'counter-1', counterStore( 1 ) );
			registry.registerStore( 'counter-2', counterStore( 10 ) );

			const Status = ( { store } ) => {
				const count = useSelect( ( select ) => select( store ).get() );
				return <div role="status">{ count }</div>;
			};

			const App = ( { store } ) => (
				<RegistryProvider value={ registry }>
					<Status store={ store } />
				</RegistryProvider>
			);

			// initial render with counter-1
			const { rerender } = render( <App store="counter-1" /> );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1' );

			// update from counter-1
			act( () => {
				registry.dispatch( 'counter-1' ).inc();
			} );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '2' );

			// rerender with counter-2
			rerender( <App store="counter-2" /> );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '10' );

			// update from counter-2 is processed because component has subscribed to counter-2
			act( () => {
				registry.dispatch( 'counter-2' ).inc();
			} );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '11' );
		} );
	} );

	describe( 'static store selection mode', () => {
		it( 'can read the current value from store', () => {
			registry.registerStore( 'testStore', counterStore() );

			const record = jest.fn();

			function TestComponent() {
				const { get } = useSelect( 'testStore' );
				return (
					<button onClick={ () => record( get() ) }>record</button>
				);
			}

			render(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);

			fireEvent.click( screen.getByRole( 'button' ) );
			expect( record ).toHaveBeenLastCalledWith( 0 );

			// no need to act() as the component doesn't react to the updates
			registry.dispatch( 'testStore' ).inc();

			fireEvent.click( screen.getByRole( 'button' ) );
			expect( record ).toHaveBeenLastCalledWith( 1 );
		} );
	} );
} );
/* eslint-enable @wordpress/wp-global-usage */
