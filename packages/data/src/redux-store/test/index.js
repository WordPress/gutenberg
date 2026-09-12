import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry } from '../../registry';
import { createRegistryControl } from '../../factory';

describe( 'controls', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	describe( 'should call registry-aware controls', () => {
		it( 'registers multiple selectors to the public API', () => {
			const action1 = vi.fn( () => ( { type: 'NOTHING' } ) );
			const action2 = function* () {
				yield { type: 'DISPATCH', store: 'store1', action: 'action1' };
			};
			registry.registerStore( 'store1', {
				reducer: () => 'state1',
				actions: {
					action1,
				},
			} );
			registry.registerStore( 'store2', {
				reducer: () => 'state2',
				actions: {
					action2,
				},
				controls: {
					DISPATCH: createRegistryControl(
						( reg ) =>
							( { store, action } ) => {
								return reg.dispatch( store )[ action ]();
							}
					),
				},
			} );

			registry.dispatch( 'store2' ).action2();
			expect( action1 ).toHaveBeenCalled();
		} );
	} );

	it( 'resolves in expected order', async () => {
		const actions = {
			standby: () => ( { type: 'STANDBY' } ),
			receive: ( items ) => ( { type: 'RECEIVE', items } ),
		};

		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state ) => state,
			},
			resolvers: {
				*getItems() {
					yield actions.standby();
					yield actions.receive( [ 1, 2, 3 ] );
				},
			},
			controls: {
				STANDBY() {
					return new Promise( ( resolve ) =>
						process.nextTick( resolve )
					);
				},
			},
		} );

		return new Promise( ( resolve ) => {
			registry.subscribe( () => {
				const isFinished = registry
					.select( 'store' )
					.hasFinishedResolution( 'getItems' );
				if ( isFinished ) {
					const items = registry.select( 'store' ).getItems();
					expect( items ).toEqual( [ 1, 2, 3 ] );
				}
				resolve();
			} );

			registry.select( 'store' ).getItems();
		} );
	} );
	describe( 'selectors have expected value for the `hasResolver` property', () => {
		it( 'when custom store has resolvers defined', () => {
			registry.registerStore( 'store', {
				reducer: vi.fn(),
				selectors: {
					getItems: ( state ) => state,
					getItem: ( state ) => state,
				},
				resolvers: {
					*getItems() {
						yield 'foo';
					},
				},
			} );
			expect( registry.select( 'store' ).getItems.hasResolver ).toBe(
				true
			);
			expect( registry.select( 'store' ).getItem.hasResolver ).toBe(
				false
			);
		} );
		it( 'when custom store does not have resolvers defined', () => {
			registry.registerStore( 'store', {
				reducer: vi.fn(),
				selectors: {
					getItems: ( state ) => state,
				},
			} );
			expect( registry.select( 'store' ).getItems.hasResolver ).toBe(
				false
			);
		} );
	} );
	describe( 'various action types have expected response and resolve as expected with controls middleware', () => {
		const actions = {
			*withPromise() {
				yield { type: 'SOME_ACTION' };
				return yield { type: 'TEST_PROMISE' };
			},
			*withNormal() {
				yield { type: 'SOME_ACTION' };
				yield { type: 'SOME_OTHER_ACTION' };
			},
			*withNonActionLikeValue() {
				yield { type: 'SOME_ACTION' };
				return 10;
			},
			normalShouldFail: () => 10,
			normal: () => ( { type: 'NORMAL' } ),
		};
		beforeEach( () => {
			registry.registerStore( 'store', {
				reducer: () => {},
				controls: {
					TEST_PROMISE() {
						return new Promise( ( resolve ) => resolve( 10 ) );
					},
				},
				actions,
			} );
		} );
		it(
			'action generator returning a yielded promise control descriptor ' +
				'resolves as expected',
			async () => {
				const withPromise = registry.dispatch( 'store' ).withPromise();
				await expect( withPromise ).resolves.toEqual( 10 );
			}
		);
		it(
			'action generator yielding normal action objects resolves as ' +
				'expected',
			async () => {
				const withNormal = registry.dispatch( 'store' ).withNormal();
				await expect( withNormal ).resolves.toBeUndefined();
			}
		);
		it( 'action generator returning a non action like value', async () => {
			const withNonActionLikeValue = registry
				.dispatch( 'store' )
				.withNonActionLikeValue();
			await expect( withNonActionLikeValue ).resolves.toEqual( 10 );
		} );
		it(
			'normal dispatch action throwing error because no action ' +
				'returned',
			() => {
				const testDispatch = () =>
					registry.dispatch( 'store' ).normalShouldFail();
				expect( testDispatch ).toThrow(
					"Actions must be plain objects. Instead, the actual type was: 'number'"
				);
			}
		);
		it( 'returns action object for normal dispatch action', async () => {
			await expect(
				registry.dispatch( 'store' ).normal()
			).resolves.toEqual( { type: 'NORMAL' } );
		} );
	} );
	describe( 'action type resolves as expected with just promise middleware', () => {
		const actions = {
			normal: () => ( { type: 'NORMAL' } ),
			withPromiseAndAction: () =>
				new Promise( ( resolve ) =>
					resolve( { type: 'WITH_PROMISE' } )
				),
			withPromiseAndNonAction: () =>
				new Promise( ( resolve ) => resolve( 10 ) ),
		};
		beforeEach( () => {
			registry.registerStore( 'store', {
				reducer: () => {},
				actions,
			} );
		} );
		it( 'normal action returns action object', async () => {
			await expect(
				registry.dispatch( 'store' ).normal()
			).resolves.toEqual( { type: 'NORMAL' } );
		} );
		it(
			'action with promise resolving to action returning ' +
				'action object',
			async () => {
				await expect(
					registry.dispatch( 'store' ).withPromiseAndAction()
				).resolves.toEqual( {
					type: 'WITH_PROMISE',
				} );
			}
		);
		it( 'action with promise returning non action throws error', async () => {
			const dispatchedAction = registry
				.dispatch( 'store' )
				.withPromiseAndNonAction();
			await expect( dispatchedAction ).rejects.toThrow(
				"Actions must be plain objects. Instead, the actual type was: 'number'."
			);
		} );
	} );
} );

describe( 'resolveSelect', () => {
	let registry;
	let shouldFail;

	beforeEach( () => {
		shouldFail = false;
		registry = createRegistry();

		registry.registerStore( 'store', {
			reducer: ( state = null ) => {
				return state;
			},
			selectors: {
				getItems: () => 'items',
				getItemsNoResolver: () => 'items-no-resolver',
			},
			resolvers: {
				getItems: () => {
					if ( shouldFail ) {
						throw new Error( 'cannot fetch items' );
					}
				},
			},
		} );
	} );

	it( 'resolves when the resolution succeeded', async () => {
		shouldFail = false;
		const promise = registry.resolveSelect( 'store' ).getItems();
		await expect( promise ).resolves.toBe( 'items' );
	} );

	it( 'rejects when the resolution failed', async () => {
		shouldFail = true;
		const promise = registry.resolveSelect( 'store' ).getItems();
		await expect( promise ).rejects.toEqual(
			new Error( 'cannot fetch items' )
		);
	} );

	it( 'resolves when calling a sync selector without resolver', async () => {
		const promise = registry.resolveSelect( 'store' ).getItemsNoResolver();
		await expect( promise ).resolves.toBe( 'items-no-resolver' );
	} );

	it( 'returns only store native selectors and excludes all meta ones', () => {
		expect( Object.keys( registry.resolveSelect( 'store' ) ) ).toEqual( [
			'getItems',
			'getItemsNoResolver',
		] );
	} );

	it( 'resolves when a resolver implements isFulfilled', async () => {
		const fulfilledResolver = () => {};
		fulfilledResolver.isFulfilled = ( state ) => !! state.items;

		const resolvedState = {
			items: [ 'item' ],
		};

		registry.registerStore( 'demo', {
			reducer: ( state = resolvedState ) => {
				return state;
			},
			selectors: {
				getItems: ( state ) => state.items,
			},
			resolvers: {
				getItems: fulfilledResolver,
			},
		} );

		const result = await registry.resolveSelect( 'demo' ).getItems();
		expect( result ).toEqual( [ 'item' ] );
	} );

	it( 'handles isFulfilled with arguments correctly', async () => {
		const fulfilledResolver = vi.fn();
		fulfilledResolver.isFulfilled = ( state, id ) => state.pages?.[ id ];

		const resolvedState = {
			pages: {
				1: { title: 'Page 1', content: 'Content 1' },
				2: { title: 'Page 2', content: 'Content 2' },
			},
		};

		registry.registerStore( 'demo', {
			reducer: ( state = resolvedState ) => state,
			selectors: {
				getPage: ( state, id ) => state.pages?.[ id ],
			},
			resolvers: {
				getPage: fulfilledResolver,
			},
		} );

		const result1 = await registry.resolveSelect( 'demo' ).getPage( 1 );
		expect( result1 ).toEqual( {
			title: 'Page 1',
			content: 'Content 1',
		} );

		const result2 = await registry.resolveSelect( 'demo' ).getPage( 2 );
		expect( result2 ).toEqual( {
			title: 'Page 2',
			content: 'Content 2',
		} );

		// Resolver should not be called since isFulfilled returns truthy
		expect( fulfilledResolver ).not.toHaveBeenCalled();
	} );

	it( 'does not change Redux state when isFulfilled returns true', async () => {
		const fulfill = vi.fn();
		const isFulfilled = () => true;

		registry.registerStore( 'demo', {
			reducer: ( state = { items: [ 'item' ] } ) => state,
			selectors: {
				getItems: ( state ) => state.items,
			},
			resolvers: {
				getItems: { fulfill, isFulfilled },
			},
		} );

		const listener = vi.fn();
		const unsubscribe = registry.subscribe( listener );

		// Call the selector — isFulfilled is true, so no resolution should happen.
		registry.select( 'demo' ).getItems();

		// Wait long enough for any setTimeout(0) resolver to have fired.
		await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

		expect( fulfill ).not.toHaveBeenCalled();
		expect( listener ).not.toHaveBeenCalled();

		unsubscribe();
	} );

	it( 'calls resolver when isFulfilled returns false', async () => {
		const fulfill = vi.fn().mockImplementation( () => ( {
			type: 'SET_DATA',
			data: 'resolved data',
		} ) );
		const isFulfilled = vi.fn( ( state ) => state.hasData );

		registry.registerStore( 'demo', {
			reducer: ( state = { hasData: false }, action ) => {
				if ( action.type === 'SET_DATA' ) {
					return { hasData: true, data: action.data };
				}
				return state;
			},
			selectors: {
				getData: ( state ) => state.data,
			},
			resolvers: {
				getData: { fulfill, isFulfilled },
			},
		} );

		const result = await registry.resolveSelect( 'demo' ).getData();

		// Initial state has hasData: false, so resolver should be called
		expect( fulfill ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( 'resolved data' );

		// Subsequent call should use cached result, not calling `fulfill` again
		const result2 = await registry.resolveSelect( 'demo' ).getData();
		expect( result2 ).toBe( 'resolved data' );
		// `fulfill` is only called once since resolution is already marked as finished
		expect( fulfill ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'normalizing args', () => {
	it( 'should call the __unstableNormalizeArgs method of the selector for both the selector and the resolver', async () => {
		const registry = createRegistry();
		const selector = () => {};

		const normalizingFunction = vi.fn( ( ...args ) => args );

		selector.__unstableNormalizeArgs = normalizingFunction;

		registry.registerStore( 'store', {
			reducer: () => {},
			selectors: {
				getItems: selector,
			},
			resolvers: {
				getItems: () => 'items',
			},
		} );
		registry.select( 'store' ).getItems( 'foo', 'bar' );

		expect( normalizingFunction ).toHaveBeenCalledWith( [ 'foo', 'bar' ] );

		// Needs to be called three times:
		// 1. When the selector is called.
		// 2. When the resolver check if it's already running.
		// 3. When the resolver is fulfilled.
		expect( normalizingFunction ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should not call the __unstableNormalizeArgs method if there are no arguments passed to the selector (and thus the resolver)', async () => {
		const registry = createRegistry();
		const selector = () => {};

		selector.__unstableNormalizeArgs = vi.fn( ( ...args ) => args );

		registry.registerStore( 'store', {
			reducer: () => {},
			selectors: {
				getItems: selector,
			},
			resolvers: {
				getItems: () => 'items',
			},
		} );

		// Called with no args so the __unstableNormalizeArgs method should not be called.
		registry.select( 'store' ).getItems();

		expect( selector.__unstableNormalizeArgs ).not.toHaveBeenCalled();
	} );

	it( 'should call the __unstableNormalizeArgs method on the selectors without resolvers', async () => {
		const registry = createRegistry();
		const selector = () => {};

		selector.__unstableNormalizeArgs = vi.fn( ( ...args ) => args );

		registry.registerStore( 'store', {
			reducer: () => {},
			selectors: {
				getItems: selector,
			},
		} );

		registry.select( 'store' ).getItems( 'foo', 'bar' );

		expect( selector.__unstableNormalizeArgs ).toHaveBeenCalledWith( [
			'foo',
			'bar',
		] );
	} );
} );

describe( 'resolution args', () => {
	// A store whose selector takes an extra leading argument the resolver does
	// not need, so calls differing only in it share one resolver run.
	function registerStore( registry, { fulfill } ) {
		registry.registerStore( 'store', {
			reducer: ( state = {}, action ) =>
				action.type === 'RECEIVE' ? action.items : state,
			selectors: {
				getItem: ( state, field, id ) => state[ id ]?.[ field ],
			},
			actions: {
				receive: ( items ) => ( { type: 'RECEIVE', items } ),
			},
			resolvers: {
				getItem: {
					getResolutionArgs: ( field, id ) => [ id ],
					fulfill,
				},
			},
		} );
	}

	it( 'should run the resolver once for selector calls that share resolution args', async () => {
		const registry = createRegistry();
		const fulfill = vi.fn(
			( id ) =>
				( { dispatch } ) =>
					dispatch.receive( { [ id ]: { a: 1, b: 2 } } )
		);
		registerStore( registry, { fulfill } );

		registry.select( 'store' ).getItem( 'a', 7 );
		registry.select( 'store' ).getItem( 'b', 7 );

		await new Promise( ( done ) => setTimeout( done, 0 ) );

		expect( fulfill ).toHaveBeenCalledTimes( 1 );
		expect( fulfill ).toHaveBeenCalledWith( 7 );
	} );

	it( 'should run the resolver again for different resolution args', async () => {
		const registry = createRegistry();
		const fulfill = vi.fn( () => () => {} );
		registerStore( registry, { fulfill } );

		registry.select( 'store' ).getItem( 'a', 7 );
		registry.select( 'store' ).getItem( 'a', 8 );

		await new Promise( ( done ) => setTimeout( done, 0 ) );

		expect( fulfill ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should resolve each selector call with its own value', async () => {
		const registry = createRegistry();
		registerStore( registry, {
			fulfill:
				( id ) =>
				( { dispatch } ) =>
					dispatch.receive( { [ id ]: { a: 'A', b: 'B' } } ),
		} );

		const resolve = registry.resolveSelect( 'store' );
		const [ a, b ] = await Promise.all( [
			resolve.getItem( 'a', 7 ),
			resolve.getItem( 'b', 7 ),
		] );

		expect( a ).toBe( 'A' );
		expect( b ).toBe( 'B' );
	} );

	it( 'should share the resolution state across selector calls', async () => {
		const registry = createRegistry();
		registerStore( registry, { fulfill: () => () => {} } );

		await registry.resolveSelect( 'store' ).getItem( 'a', 7 );

		const { hasFinishedResolution } = registry.select( 'store' );
		expect( hasFinishedResolution( 'getItem', [ 'a', 7 ] ) ).toBe( true );
		expect( hasFinishedResolution( 'getItem', [ 'b', 7 ] ) ).toBe( true );
		expect( hasFinishedResolution( 'getItem', [ 'a', 8 ] ) ).toBe( false );
	} );

	it( 'should suspend both selector calls on one resolution', async () => {
		const registry = createRegistry();
		const fulfill = vi.fn( () => () => {} );
		registerStore( registry, { fulfill } );

		const suspend = registry.suspendSelect( 'store' );
		expect( () => suspend.getItem( 'a', 7 ) ).toThrow( Promise );
		expect( () => suspend.getItem( 'b', 7 ) ).toThrow( Promise );

		await new Promise( ( done ) => setTimeout( done, 0 ) );

		expect( fulfill ).toHaveBeenCalledTimes( 1 );
		expect( suspend.getItem( 'a', 7 ) ).toBeUndefined();
	} );

	it( 'should apply getResolutionArgs after __unstableNormalizeArgs', async () => {
		const registry = createRegistry();
		const selector = ( state, field, id ) => state[ id ]?.[ field ];
		// Coerce the numeric id, then drop the field.
		selector.__unstableNormalizeArgs = ( [ field, id ] ) => [
			field,
			Number( id ),
		];
		const fulfill = vi.fn( () => () => {} );

		registry.registerStore( 'store', {
			reducer: ( state = {} ) => state,
			selectors: { getItem: selector },
			resolvers: {
				getItem: {
					getResolutionArgs: ( field, id ) => [ id ],
					fulfill,
				},
			},
		} );

		registry.select( 'store' ).getItem( 'a', '7' );

		await new Promise( ( done ) => setTimeout( done, 0 ) );

		expect( fulfill ).toHaveBeenCalledWith( 7 );
	} );

	it( 'should not call getResolutionArgs when the selector takes no arguments', async () => {
		const registry = createRegistry();
		const getResolutionArgs = vi.fn( ( ...args ) => args );

		registry.registerStore( 'store', {
			reducer: ( state = {} ) => state,
			selectors: { getItems: () => {} },
			resolvers: {
				getItems: { getResolutionArgs, fulfill: () => () => {} },
			},
		} );

		registry.select( 'store' ).getItems();

		expect( getResolutionArgs ).not.toHaveBeenCalled();
	} );
} );
