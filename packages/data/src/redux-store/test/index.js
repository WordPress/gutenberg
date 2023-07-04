/**
 * Internal dependencies
 */
import { createRegistry } from '../../registry';
import { createRegistryControl } from '../../factory';

describe( 'controls', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	describe( 'should call registry-aware controls', () => {
		it( 'registers multiple selectors to the public API', () => {
			const action1 = jest.fn( () => ( { type: 'NOTHING' } ) );
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
					// eslint-disable-next-line jest/no-conditional-expect
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
				reducer: jest.fn(),
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
				reducer: jest.fn(),
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
} );

describe( 'normalizing args', () => {
	it( 'should call the normalizeArgs method of the selector for both the selector and the resolver', async () => {
		const registry = createRegistry();
		const selector = () => {};

		const normalizingFunction = jest.fn( ( ...args ) => args );

		selector.normalizeArgs = normalizingFunction;

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

		// Needs to be call twice:
		// 1. When the selector is called.
		// 2. When the resolver is fullfilled.
		expect( normalizingFunction ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not call the normalizeArgs method if there are no arguments passed to the selector (and thus the resolver)', async () => {
		const registry = createRegistry();
		const selector = () => {};

		selector.normalizeArgs = jest.fn( ( ...args ) => args );

		registry.registerStore( 'store', {
			reducer: () => {},
			selectors: {
				getItems: selector,
			},
			resolvers: {
				getItems: () => 'items',
			},
		} );

		// Called with no args so the normalizeArgs method should not be called.
		registry.select( 'store' ).getItems();

		expect( selector.normalizeArgs ).not.toHaveBeenCalled();
	} );
} );
