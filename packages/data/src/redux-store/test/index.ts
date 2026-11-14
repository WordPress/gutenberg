import type { AnyAction } from 'redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry } from '../../registry';
import { createRegistryControl } from '../../factory';
import type { DataRegistry, NormalizedResolver } from '../../types';

declare const process: { nextTick: ( callback: () => void ) => void };

type SelectorWithNormalizeArgs = ( ( ...args: any[] ) => any ) & {
	normalizeArgs?: ( ...args: any[] ) => any;
	__unstableNormalizeArgs?: ( ...args: any[] ) => any;
};

type SelectorWithResolver = ( ( ...args: any[] ) => any ) & {
	hasResolver?: boolean;
};

type ResolverWithIsFulfilled = ( ( ...args: any[] ) => any ) & {
	isFulfilled?: ( ...args: any[] ) => any;
};

describe( 'controls', () => {
	let registry: DataRegistry;

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
							( {
								store,
								action,
							}: {
								store: string;
								action: string;
							} ) => {
								return (
									reg.dispatch( store ) as Record<
										string,
										( ...args: any[] ) => any
									>
								 )[ action ]();
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
			receive: ( items: number[] ) => ( { type: 'RECEIVE', items } ),
		};

		registry.registerStore( 'store', {
			reducer: ( state = null, action: AnyAction ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state: number[] | null ) => state,
			},
			resolvers: {
				*getItems() {
					yield actions.standby();
					yield actions.receive( [ 1, 2, 3 ] );
				},
			},
			controls: {
				STANDBY() {
					return new Promise< void >( ( resolve ) =>
						process.nextTick( resolve )
					);
				},
			},
		} );

		await new Promise< void >( ( resolve ) => {
			registry.subscribe( () => {
				const isFinished = registry
					.select( 'store' )
					.hasFinishedResolution( 'getItems' );
				if ( isFinished ) {
					resolve();
				}
			} );

			registry.select( 'store' ).getItems();
		} );
		expect( registry.select( 'store' ).getItems() ).toEqual( [ 1, 2, 3 ] );
	} );
	describe( 'selectors have expected value for the `hasResolver` property', () => {
		it( 'when custom store has resolvers defined', () => {
			registry.registerStore( 'store', {
				reducer: vi.fn(),
				selectors: {
					getItems: ( state: unknown ) => state,
					getItem: ( state: unknown ) => state,
				},
				resolvers: {
					*getItems() {
						yield 'foo';
					},
				},
			} );
			expect(
				( registry.select( 'store' ).getItems as SelectorWithResolver )
					.hasResolver
			).toBe( true );
			expect(
				( registry.select( 'store' ).getItem as SelectorWithResolver )
					.hasResolver
			).toBe( false );
		} );
		it( 'when custom store does not have resolvers defined', () => {
			registry.registerStore( 'store', {
				reducer: vi.fn(),
				selectors: {
					getItems: ( state: unknown ) => state,
				},
			} );
			expect(
				( registry.select( 'store' ).getItems as SelectorWithResolver )
					.hasResolver
			).toBe( false );
		} );
	} );
	describe( 'various action types have expected response and resolve as expected with controls middleware', () => {
		const actions = {
			*withPromise(): Generator< { type: string }, unknown, unknown > {
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
	let registry: DataRegistry;
	let shouldFail: boolean;

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
		const fulfilledResolver: ResolverWithIsFulfilled = () => {};
		fulfilledResolver.isFulfilled = (
			state: Record< string, unknown[] >
		) => !! state.items;

		const resolvedState = {
			items: [ 'item' ],
		};

		registry.registerStore( 'demo', {
			reducer: ( state = resolvedState ) => {
				return state;
			},
			selectors: {
				getItems: ( state: typeof resolvedState ) => state.items,
			},
			resolvers: {
				getItems: fulfilledResolver,
			},
		} );

		const result = await registry.resolveSelect( 'demo' ).getItems();
		expect( result ).toEqual( [ 'item' ] );
	} );

	it( 'handles isFulfilled with arguments correctly', async () => {
		const fulfilledResolver: ResolverWithIsFulfilled = Object.assign(
			vi.fn(),
			{
				isFulfilled: (
					state: {
						pages?: Record<
							number,
							{ title: string; content: string }
						>;
					},
					id: number
				) => state.pages?.[ id ],
			}
		);

		const resolvedState: {
			pages: Record< number, { title: string; content: string } >;
		} = {
			pages: {
				1: { title: 'Page 1', content: 'Content 1' },
				2: { title: 'Page 2', content: 'Content 2' },
			},
		};

		registry.registerStore( 'demo', {
			reducer: ( state = resolvedState ) => state,
			selectors: {
				getPage: ( state: typeof resolvedState, id: number ) =>
					state.pages?.[ id ],
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
				getItems: ( state: { items: string[] } ) => state.items,
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
		const isFulfilled = vi.fn(
			( state: { hasData: boolean } ) => state.hasData
		);

		registry.registerStore( 'demo', {
			reducer: (
				state = { hasData: false },
				action: AnyAction & { data?: string }
			) => {
				if ( action.type === 'SET_DATA' ) {
					return { hasData: true, data: action.data };
				}
				return state;
			},
			selectors: {
				getData: ( state: { data?: string } ) => state.data,
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
	it( 'should call the normalizeArgs method of the selector for both the selector and the resolver', async () => {
		const registry = createRegistry();
		const selector: SelectorWithNormalizeArgs = () => {};

		const normalizingFunction = vi.fn( ( ...args: unknown[] ) => args );

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

		// Needs to be called three times:
		// 1. When the selector is called.
		// 2. When the resolver check if it's already running.
		// 3. When the resolver is fulfilled.
		expect( normalizingFunction ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should not call the normalizeArgs method if there are no arguments passed to the selector (and thus the resolver)', async () => {
		const registry = createRegistry();
		const selector: SelectorWithNormalizeArgs = () => {};

		selector.normalizeArgs = vi.fn( ( ...args: unknown[] ) => args );

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

	it( 'should call the normalizeArgs method on the selectors without resolvers', async () => {
		const registry = createRegistry();
		const selector: SelectorWithNormalizeArgs = () => {};

		selector.normalizeArgs = vi.fn( ( ...args: unknown[] ) => args );

		registry.registerStore( 'store', {
			reducer: () => {},
			selectors: {
				getItems: selector,
			},
		} );

		registry.select( 'store' ).getItems( 'foo', 'bar' );

		expect( selector.normalizeArgs ).toHaveBeenCalledWith( [
			'foo',
			'bar',
		] );
	} );

	it( 'should call the legacy __unstableNormalizeArgs method', async () => {
		const registry = createRegistry();
		const selector: SelectorWithNormalizeArgs = () => {};

		selector.__unstableNormalizeArgs = vi.fn( ( args: unknown[] ) => args );

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

		expect( selector.__unstableNormalizeArgs ).toHaveBeenCalledWith( [
			'foo',
			'bar',
		] );
	} );
} );

describe( 'resolution args', () => {
	// A store whose selector takes an extra leading argument the resolver does
	// not need, so calls differing only in it share one resolver run.
	function registerStore(
		registry: DataRegistry,
		{ fulfill }: { fulfill: NormalizedResolver[ 'fulfill' ] }
	) {
		registry.registerStore( 'store', {
			reducer: (
				state = {},
				action: AnyAction & { items?: Record< string, unknown > }
			) => ( action.type === 'RECEIVE' ? action.items : state ),
			selectors: {
				getItem: (
					state: Record< string, Record< string, unknown > >,
					field: string,
					id: string | number
				) => state[ id ]?.[ field ],
			},
			actions: {
				receive: ( items: Record< string, unknown > ) => ( {
					type: 'RECEIVE',
					items,
				} ),
			},
			resolvers: {
				getItem: {
					getResolutionArgs: (
						_field: string,
						id: string | number
					) => [ id ],
					fulfill,
				},
			},
		} );
	}

	it( 'should run the resolver once for selector calls that share resolution args', async () => {
		const registry = createRegistry();
		const fulfill = vi.fn(
			( id: number ) =>
				( {
					dispatch,
				}: {
					dispatch: Record< string, ( ...args: any[] ) => any >;
				} ) =>
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
				( id: number ) =>
				( {
					dispatch,
				}: {
					dispatch: Record< string, ( ...args: any[] ) => any >;
				} ) =>
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

	it( 'should apply getResolutionArgs after normalizeArgs', async () => {
		const registry = createRegistry();
		const selector: SelectorWithNormalizeArgs = (
			state: Record< string, Record< string, unknown > >,
			field: string,
			id: string | number
		) => state[ id ]?.[ field ];
		// Coerce the numeric id, then drop the field.
		selector.normalizeArgs = ( [ field, id ]: [ string, string ] ) => [
			field,
			Number( id ),
		];
		const fulfill = vi.fn( () => () => {} );

		registry.registerStore( 'store', {
			reducer: ( state = {} ) => state,
			selectors: { getItem: selector },
			resolvers: {
				getItem: {
					getResolutionArgs: (
						_field: string,
						id: string | number
					) => [ id ],
					fulfill,
				},
			},
		} );

		registry.select( 'store' ).getItem( 'a', '7' );

		await new Promise( ( done ) => setTimeout( done, 0 ) );

		expect( fulfill ).toHaveBeenCalledWith( 7 );
	} );
} );
