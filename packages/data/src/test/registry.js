/**
 * External dependencies
 */
import { castArray, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import { createRegistry } from '../registry';
import { createRegistrySelector } from '../factory';
import createReduxStore from '../redux-store';
import { STORE_NAME } from '../store/name';

jest.useFakeTimers();

describe( 'createRegistry', () => {
	let registry;

	const unsubscribes = [];
	function subscribeWithUnsubscribe( ...args ) {
		const unsubscribe = registry.subscribe( ...args );
		unsubscribes.push( unsubscribe );
		return unsubscribe;
	}
	function subscribeUntil( predicates ) {
		predicates = castArray( predicates );

		return new Promise( ( resolve ) => {
			subscribeWithUnsubscribe( () => {
				if ( predicates.every( ( predicate ) => predicate() ) ) {
					resolve();
				}
			} );
		} );
	}

	beforeEach( () => {
		registry = createRegistry();
	} );

	afterEach( () => {
		let unsubscribe;
		while ( ( unsubscribe = unsubscribes.shift() ) ) {
			unsubscribe();
		}
	} );

	describe( 'registerGenericStore', () => {
		let getSelectors;
		let getActions;
		let subscribe;

		beforeEach( () => {
			getSelectors = () => ( {} );
			getActions = () => ( {} );
			subscribe = () => ( {} );
		} );

		it( 'should throw if not all required config elements are present', () => {
			expect( () =>
				registry.registerGenericStore( 'grocer', {} )
			).toThrow();
			expect( () =>
				registry.registerGenericStore( 'grocer', {
					getSelectors,
					getActions,
				} )
			).toThrow();
			expect( () =>
				registry.registerGenericStore( 'grocer', {
					getActions,
					subscribe,
				} )
			).toThrow();
		} );

		describe( 'getSelectors', () => {
			it( 'should make selectors available via registry.select', () => {
				const items = {
					broccoli: { price: 2, quantity: 15 },
					lettuce: { price: 1, quantity: 12 },
				};

				function getPrice( itemName ) {
					const item = items[ itemName ];
					return item && item.price;
				}

				function getQuantity( itemName ) {
					const item = items[ itemName ];
					return item && item.quantity;
				}

				getSelectors = () => ( { getPrice, getQuantity } );

				registry.registerGenericStore( 'grocer', {
					getSelectors,
					getActions,
					subscribe,
				} );

				expect( registry.select( 'grocer' ).getPrice ).toEqual(
					getPrice
				);
				expect( registry.select( 'grocer' ).getQuantity ).toEqual(
					getQuantity
				);
			} );
		} );

		describe( 'getActions', () => {
			it( 'should make actions available via registry.dispatch', () => {
				const dispatch = jest.fn();

				function setPrice( itemName, price ) {
					return { type: 'SET_PRICE', itemName, price };
				}

				function setQuantity( itemName, quantity ) {
					return { type: 'SET_QUANTITY', itemName, quantity };
				}

				getActions = () => {
					return {
						setPrice: ( ...args ) =>
							dispatch( setPrice( ...args ) ),
						setQuantity: ( ...args ) =>
							dispatch( setQuantity( ...args ) ),
					};
				};

				registry.registerGenericStore( 'grocer', {
					getSelectors,
					getActions,
					subscribe,
				} );

				expect( dispatch ).not.toHaveBeenCalled();

				registry.dispatch( 'grocer' ).setPrice( 'broccoli', 3 );
				expect( dispatch ).toHaveBeenCalledTimes( 1 );
				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'SET_PRICE',
					itemName: 'broccoli',
					price: 3,
				} );

				registry.dispatch( 'grocer' ).setQuantity( 'lettuce', 8 );
				expect( dispatch ).toHaveBeenCalledTimes( 2 );
				expect( dispatch ).toHaveBeenCalledWith( {
					type: 'SET_QUANTITY',
					itemName: 'lettuce',
					quantity: 8,
				} );
			} );
		} );

		describe( 'subscribe', () => {
			it( 'should send out updates to listeners of the registry', () => {
				const registryListener = jest.fn();

				let listener = () => {};
				const storeChanged = () => {
					listener();
				};
				subscribe = ( newListener ) => {
					listener = newListener;
				};

				const unsubscribe = registry.subscribe( registryListener );
				registry.registerGenericStore( 'grocer', {
					getSelectors,
					getActions,
					subscribe,
				} );

				expect( registryListener ).not.toHaveBeenCalled();
				storeChanged();
				expect( registryListener ).toHaveBeenCalledTimes( 1 );
				storeChanged();
				expect( registryListener ).toHaveBeenCalledTimes( 2 );
				unsubscribe();
				storeChanged();
				expect( registryListener ).toHaveBeenCalledTimes( 2 );
			} );
		} );
	} );

	describe( 'registerStore', () => {
		it( 'should be shorthand for reducer, actions, selectors registration', () => {
			const store = registry.registerStore( 'butcher', {
				reducer( state = {}, action ) {
					switch ( action.type ) {
						case 'sale':
							return {
								...state,
								[ action.meat ]: state[ action.meat ] / 2,
							};
					}

					return state;
				},
				initialState: { ribs: 6, chicken: 4 },
				selectors: {
					getPrice: ( state, meat ) => state[ meat ],
				},
				actions: {
					startSale: ( meat ) => ( { type: 'sale', meat } ),
				},
			} );

			expect( store.getState() ).toEqual( { ribs: 6, chicken: 4 } );
			expect( registry.dispatch( 'butcher' ) ).toHaveProperty(
				'startSale'
			);
			expect( registry.select( 'butcher' ) ).toHaveProperty( 'getPrice' );
			expect( registry.select( 'butcher' ).getPrice( 'chicken' ) ).toBe(
				4
			);
			expect( registry.select( 'butcher' ).getPrice( 'ribs' ) ).toBe( 6 );
			registry.dispatch( 'butcher' ).startSale( 'chicken' );
			expect( registry.select( 'butcher' ).getPrice( 'chicken' ) ).toBe(
				2
			);
			expect( registry.select( 'butcher' ).getPrice( 'ribs' ) ).toBe( 6 );
		} );

		it( 'Should append reducers to the state', () => {
			const reducer1 = () => 'chicken';
			const reducer2 = () => 'ribs';

			const store = registry.registerStore( 'red1', {
				reducer: reducer1,
			} );
			expect( store.getState() ).toEqual( 'chicken' );

			const store2 = registry.registerStore( 'red2', {
				reducer: reducer2,
			} );
			expect( store2.getState() ).toEqual( 'ribs' );
		} );

		it( 'should not do anything for selectors which do not have resolvers', () => {
			registry.registerStore( 'demo', {
				reducer: ( state = 'OK' ) => state,
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {},
			} );

			expect( registry.select( 'demo' ).getValue() ).toBe( 'OK' );
		} );

		it( 'should behave as a side effect for the given selector, with arguments', () => {
			const resolver = jest.fn();
			registry.registerStore( 'demo', {
				reducer: ( state = 'OK' ) => state,
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: resolver,
				},
			} );

			const value = registry.select( 'demo' ).getValue( 'arg1', 'arg2' );
			jest.runAllTimers();
			expect( value ).toBe( 'OK' );
			expect( resolver ).toHaveBeenCalledWith( 'arg1', 'arg2' );
			registry.select( 'demo' ).getValue( 'arg1', 'arg2' );
			jest.runAllTimers();
			expect( resolver ).toHaveBeenCalledTimes( 1 );
			registry.select( 'demo' ).getValue( 'arg3', 'arg4' );
			jest.runAllTimers();
			expect( resolver ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should support the object resolver definition', () => {
			const resolver = jest.fn();
			registry.registerStore( 'demo', {
				reducer: ( state = 'OK' ) => state,
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: { fulfill: resolver },
				},
			} );

			const value = registry.select( 'demo' ).getValue( 'arg1', 'arg2' );
			jest.runAllTimers();
			expect( value ).toBe( 'OK' );
		} );

		it( 'should use isFulfilled definition before calling the side effect', () => {
			const fulfill = jest.fn().mockImplementation( ( state, page ) => {
				return { type: 'SET_PAGE', page, result: [] };
			} );

			const store = registry.registerStore( 'demo', {
				reducer: ( state = {}, action ) => {
					switch ( action.type ) {
						case 'SET_PAGE':
							return {
								...state,
								[ action.page ]: action.result,
							};
					}

					return state;
				},
				selectors: {
					getPage: ( state, page ) => state[ page ],
				},
				resolvers: {
					getPage: {
						fulfill,
						isFulfilled( state, page ) {
							return state.hasOwnProperty( page );
						},
					},
				},
			} );

			store.dispatch( { type: 'SET_PAGE', page: 4, result: [] } );
			registry.select( 'demo' ).getPage( 1 );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 2 );
			jest.runAllTimers();

			expect( fulfill ).toHaveBeenCalledTimes( 2 );

			registry.select( 'demo' ).getPage( 1 );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 2 );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 3, {} );
			jest.runAllTimers();

			// Expected: First and second page fulfillments already triggered, so
			// should only be one more than previous assertion set.
			expect( fulfill ).toHaveBeenCalledTimes( 3 );

			registry.select( 'demo' ).getPage( 1 );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 2 );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 3, {} );
			jest.runAllTimers();
			registry.select( 'demo' ).getPage( 4 );

			// Expected:
			//  - Fourth page was pre-filled. Necessary to determine via
			//    isFulfilled, but fulfillment resolver should not be triggered.
			//  - Third page arguments are not strictly equal but are equivalent,
			//    so fulfillment should already be satisfied.
			expect( fulfill ).toHaveBeenCalledTimes( 3 );

			registry.select( 'demo' ).getPage( 4, {} );
		} );

		it( 'should resolve action to dispatch', () => {
			registry.registerStore( 'demo', {
				reducer: ( state = 'NOTOK', action ) => {
					return action.type === 'SET_OK' ? 'OK' : state;
				},
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: () => ( { type: 'SET_OK' } ),
				},
			} );

			const promise = subscribeUntil( [
				() => registry.select( 'demo' ).getValue() === 'OK',
				() =>
					registry
						.select( STORE_NAME )
						.hasFinishedResolution( 'demo', 'getValue' ),
			] );

			registry.select( 'demo' ).getValue();
			jest.runAllTimers();

			return promise;
		} );

		it( 'should resolve promise action to dispatch', () => {
			registry.registerStore( 'demo', {
				reducer: ( state = 'NOTOK', action ) => {
					return action.type === 'SET_OK' ? 'OK' : state;
				},
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: () => Promise.resolve( { type: 'SET_OK' } ),
				},
			} );

			const promise = subscribeUntil( [
				() => registry.select( 'demo' ).getValue() === 'OK',
				() =>
					registry
						.select( STORE_NAME )
						.hasFinishedResolution( 'demo', 'getValue' ),
			] );

			registry.select( 'demo' ).getValue();
			jest.runAllTimers();

			return promise;
		} );

		it( 'should resolve promise non-action to dispatch', () => {
			let shouldThrow = false;
			registry.registerStore( 'demo', {
				reducer: ( state = 'OK' ) => {
					if ( shouldThrow ) {
						throw 'Should not have dispatched';
					}

					return state;
				},
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: () => Promise.resolve(),
				},
			} );
			shouldThrow = true;

			registry.select( 'demo' ).getValue();
			jest.runAllTimers();

			return new Promise( ( resolve ) => process.nextTick( resolve ) );
		} );

		it( 'should not dispatch resolved promise action on subsequent selector calls', () => {
			registry.registerStore( 'demo', {
				reducer: ( state = 'NOTOK', action ) => {
					return action.type === 'SET_OK' && state === 'NOTOK'
						? 'OK'
						: 'NOTOK';
				},
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: () => Promise.resolve( { type: 'SET_OK' } ),
				},
			} );

			const promise = subscribeUntil(
				() => registry.select( 'demo' ).getValue() === 'OK'
			);

			registry.select( 'demo' ).getValue();
			jest.runAllTimers();
			registry.select( 'demo' ).getValue();
			jest.runAllTimers();

			return promise;
		} );

		it( "should invalidate the resolver's resolution cache", async () => {
			registry.registerStore( 'demo', {
				reducer: ( state = 'NOTOK', action ) => {
					return action.type === 'SET_OK' && state === 'NOTOK'
						? 'OK'
						: 'NOTOK';
				},
				selectors: {
					getValue: ( state ) => state,
				},
				resolvers: {
					getValue: {
						fulfill: () => Promise.resolve( { type: 'SET_OK' } ),
						shouldInvalidate: ( action ) =>
							action.type === 'INVALIDATE',
					},
				},
				actions: {
					invalidate: () => ( { type: 'INVALIDATE' } ),
				},
			} );

			let promise = subscribeUntil(
				() => registry.select( 'demo' ).getValue() === 'OK'
			);
			registry.select( 'demo' ).getValue(); // Triggers resolver switches to OK
			jest.runAllTimers();
			await promise;

			// Invalidate the cache
			registry.dispatch( 'demo' ).invalidate();

			promise = subscribeUntil(
				() => registry.select( 'demo' ).getValue() === 'NOTOK'
			);
			registry.select( 'demo' ).getValue(); // Triggers the resolver again and switch to NOTOK
			jest.runAllTimers();
			await promise;
		} );
	} );

	describe( 'register', () => {
		it( 'should work with the store definition as param for select', () => {
			const store = createReduxStore( 'demo', {
				reducer: ( state = 'OK' ) => state,
				selectors: {
					getValue: ( state ) => state,
				},
			} );
			registry.register( store );

			expect( registry.select( store ).getValue() ).toBe( 'OK' );
		} );

		it( 'should work with the store definition as param for dispatch', async () => {
			const store = createReduxStore( 'demo', {
				reducer( state = 'OK', action ) {
					if ( action.type === 'UPDATE' ) {
						return 'UPDATED';
					}
					return state;
				},
				actions: {
					update() {
						return { type: 'UPDATE' };
					},
				},
				selectors: {
					getValue: ( state ) => state,
				},
			} );
			registry.register( store );

			expect( registry.select( store ).getValue() ).toBe( 'OK' );
			await registry.dispatch( store ).update();
			expect( registry.select( store ).getValue() ).toBe( 'UPDATED' );
		} );
	} );

	describe( 'select', () => {
		it( 'registers multiple selectors to the public API', () => {
			const selector1 = jest.fn( () => 'result1' );
			const selector2 = jest.fn( () => 'result2' );
			const store = registry.registerStore( 'reducer1', {
				reducer: () => 'state1',
				selectors: {
					selector1,
					selector2,
				},
			} );

			expect( registry.select( 'reducer1' ).selector1() ).toEqual(
				'result1'
			);
			expect( selector1 ).toHaveBeenCalledWith( store.getState() );

			expect( registry.select( 'reducer1' ).selector2() ).toEqual(
				'result2'
			);
			expect( selector2 ).toHaveBeenCalledWith( store.getState() );
		} );

		it( 'should run the registry selectors properly', () => {
			const selector1 = () => 'result1';
			const selector2 = createRegistrySelector( ( select ) => () =>
				select( 'reducer1' ).selector1()
			);
			registry.registerStore( 'reducer1', {
				reducer: () => 'state1',
				selectors: {
					selector1,
				},
			} );
			registry.registerStore( 'reducer2', {
				reducer: () => 'state1',
				selectors: {
					selector2,
				},
			} );

			expect( registry.select( 'reducer2' ).selector2() ).toEqual(
				'result1'
			);
		} );

		it( 'should run the registry selector from a non-registry selector', () => {
			const selector1 = () => 'result1';
			const selector2 = createRegistrySelector( ( select ) => () =>
				select( 'reducer1' ).selector1()
			);
			const selector3 = () => selector2();
			registry.registerStore( 'reducer1', {
				reducer: () => 'state1',
				selectors: {
					selector1,
				},
			} );
			registry.registerStore( 'reducer2', {
				reducer: () => 'state1',
				selectors: {
					selector2,
					selector3,
				},
			} );

			expect( registry.select( 'reducer2' ).selector3() ).toEqual(
				'result1'
			);
		} );
	} );

	describe( 'subscribe', () => {
		it( 'registers multiple selectors to the public API', () => {
			let incrementedValue = null;
			const store = registry.registerStore( 'myAwesomeReducer', {
				reducer: ( state = 0 ) => state + 1,
				selectors: {
					globalSelector: ( state ) => state,
				},
			} );
			const unsubscribe = registry.subscribe( () => {
				incrementedValue = registry
					.select( 'myAwesomeReducer' )
					.globalSelector();
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

		it( 'snapshots listeners on change, avoiding a later listener if subscribed during earlier callback', () => {
			const store = registry.registerStore( 'myAwesomeReducer', {
				reducer: ( state = 0 ) => state + 1,
			} );
			const secondListener = jest.fn();
			const firstListener = jest.fn( () => {
				subscribeWithUnsubscribe( secondListener );
			} );

			subscribeWithUnsubscribe( firstListener );

			store.dispatch( { type: 'dummy' } );

			expect( secondListener ).not.toHaveBeenCalled();
		} );

		it( 'snapshots listeners on change, calling a later listener even if unsubscribed during earlier callback', () => {
			const store = registry.registerStore( 'myAwesomeReducer', {
				reducer: ( state = 0 ) => state + 1,
			} );
			const firstListener = jest.fn( () => {
				secondUnsubscribe();
			} );
			const secondListener = jest.fn();

			subscribeWithUnsubscribe( firstListener );
			const secondUnsubscribe = subscribeWithUnsubscribe(
				secondListener
			);

			store.dispatch( { type: 'dummy' } );

			expect( secondListener ).toHaveBeenCalled();
		} );

		it( 'does not call listeners if state has not changed', () => {
			const store = registry.registerStore( 'unchanging', {
				reducer: ( state = {} ) => state,
			} );
			const listener = jest.fn();
			subscribeWithUnsubscribe( listener );

			store.dispatch( { type: 'dummy' } );

			expect( listener ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'dispatch', () => {
		it( 'registers actions to the public API', async () => {
			const increment = ( count = 1 ) => ( { type: 'increment', count } );
			const store = registry.registerStore( 'counter', {
				reducer: ( state = 0, action ) => {
					if ( action.type === 'increment' ) {
						return state + action.count;
					}
					return state;
				},
				actions: {
					increment,
				},
			} );
			// state = 1
			const dispatchResult = await registry
				.dispatch( 'counter' )
				.increment();
			await expect( dispatchResult ).toEqual( {
				type: 'increment',
				count: 1,
			} );
			registry.dispatch( 'counter' ).increment( 4 ); // state = 5
			expect( store.getState() ).toBe( 5 );
		} );
	} );

	describe( 'use', () => {
		it( 'should pass through options object to plugin', () => {
			const expectedOptions = {};
			let actualOptions;

			function plugin( _registry, options ) {
				// The registry passed to a plugin is not the same as the one
				// returned by createRegistry, as the former uses the internal
				// representation of the object, the latter applying its
				// function proxying.
				expect( _registry ).toMatchObject(
					mapValues( registry, ( value, key ) => {
						if ( key === 'stores' ) {
							return expect.any( Object );
						}
						// TODO: Remove this after namsespaces is removed.
						if ( key === 'namespaces' ) {
							return registry.stores;
						}
						return expect.any( Function );
					} )
				);

				actualOptions = options;

				return {};
			}

			registry.use( plugin, expectedOptions );

			expect( actualOptions ).toBe( expectedOptions );
		} );

		it( 'should override base method', () => {
			function plugin( _registry, options ) {
				return { select: () => options.value };
			}

			registry.use( plugin, { value: 10 } );

			expect( registry.select() ).toBe( 10 );
		} );
	} );

	describe( 'parent registry', () => {
		it( 'should call parent registry selectors/actions if defined', () => {
			const mySelector = jest.fn();
			const myAction = jest.fn();
			const getSelectors = () => ( { mySelector } );
			const getActions = () => ( { myAction } );
			const subscribe = () => {};
			registry.registerGenericStore( 'store', {
				getSelectors,
				getActions,
				subscribe,
			} );
			const subRegistry = createRegistry( {}, registry );

			subRegistry.select( 'store' ).mySelector();
			subRegistry.dispatch( 'store' ).myAction();

			expect( mySelector ).toHaveBeenCalled();
			expect( myAction ).toHaveBeenCalled();
		} );

		it( 'should override existing store in parent registry', () => {
			const mySelector = jest.fn();
			const myAction = jest.fn();
			const getSelectors = () => ( { mySelector } );
			const getActions = () => ( { myAction } );
			const subscribe = () => {};
			registry.registerGenericStore( 'store', {
				getSelectors,
				getActions,
				subscribe,
			} );

			const subRegistry = createRegistry( {}, registry );
			const mySelector2 = jest.fn();
			const myAction2 = jest.fn();
			const getSelectors2 = () => ( { mySelector: mySelector2 } );
			const getActions2 = () => ( { myAction: myAction2 } );
			const subscribe2 = () => {};
			subRegistry.registerGenericStore( 'store', {
				getSelectors: getSelectors2,
				getActions: getActions2,
				subscribe: subscribe2,
			} );

			subRegistry.select( 'store' ).mySelector();
			subRegistry.dispatch( 'store' ).myAction();

			expect( mySelector ).not.toHaveBeenCalled();
			expect( myAction ).not.toHaveBeenCalled();

			expect( mySelector2 ).toHaveBeenCalled();
			expect( myAction2 ).toHaveBeenCalled();
		} );
	} );
} );
