import deepFreeze from 'deep-freeze';
import type { AnyAction, Store as ReduxStore } from 'redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import plugin, { createPersistenceInterface, withLazySameState } from '../';
import objectStorage from '../storage/object';
import { createRegistry } from '../../../';
import type { DataRegistry, ReduxStoreConfig } from '../../../types';

type PersistStoreConfig = ReduxStoreConfig< any, any, any > & {
	persist?: boolean | string[];
};

type PersistedRegistry = Omit< DataRegistry, 'registerStore' > & {
	registerStore: (
		storeName: string,
		options: PersistStoreConfig
	) => ReduxStore;
};

describe( 'persistence', () => {
	let registry: PersistedRegistry;

	beforeEach( () => {
		vi.spyOn( objectStorage, 'setItem' );
		objectStorage.clear();
		vi.mocked( objectStorage.setItem ).mockClear();

		// TODO: Remove the `use` function in favor of `registerGenericStore`
		registry = createRegistry().use( plugin, {
			storage: objectStorage,
		} ) as PersistedRegistry;
	} );

	it( 'should not mutate options', () => {
		expect( () => {
			const options = Object.freeze( { persist: true, reducer() {} } );
			registry.registerStore( 'test', options );
		} ).not.toThrow( /object is not extensible/ );
	} );

	it( 'should load a persisted value as initialState', () => {
		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () => JSON.stringify( { test: { a: 1 } } ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state: Record< string, unknown > = {} ) => state,
			selectors: {
				getState: ( state: Record< string, unknown > ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toEqual( { a: 1 } );
	} );

	it( 'should load a persisted subset value as initialState', () => {
		const DEFAULT_STATE = { a: null, b: null };

		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () => JSON.stringify( { test: { a: 1 } } ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: [ 'a' ],
			reducer: ( state = DEFAULT_STATE ) => state,
			selectors: {
				getState: ( state: typeof DEFAULT_STATE ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toEqual( {
			a: 1,
			b: null,
		} );
	} );

	it( 'should merge persisted value with default if object-like', () => {
		const DEFAULT_STATE = deepFreeze( {
			preferences: { useFoo: true, useBar: true },
		} );

		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () =>
					JSON.stringify( {
						test: {
							preferences: {
								useFoo: false,
							},
						},
					} ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: [ 'preferences' ],
			reducer: ( state = DEFAULT_STATE ) => state,
			selectors: {
				getState: ( state: typeof DEFAULT_STATE ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toEqual( {
			preferences: {
				useFoo: false,
				useBar: true,
			},
		} );
	} );

	it( 'should defer to persisted state if mismatch of object-like (persisted object-like)', () => {
		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () => JSON.stringify( { test: { persisted: true } } ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state: { persisted: boolean } | null = null ) => state,
			selectors: {
				getState: ( state: { persisted: boolean } | null ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toEqual( {
			persisted: true,
		} );
	} );

	it( 'should defer to persisted state if mismatch of object-like (initial object-like)', () => {
		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () => JSON.stringify( { test: null } ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state: Record< string, unknown > | null = {} ) => state,
			selectors: {
				getState: ( state: Record< string, unknown > | null ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toBe( null );
	} );

	it( 'should be reasonably tolerant to a non-object persisted state', () => {
		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () =>
					JSON.stringify( {
						test: 1,
					} ),
				setItem() {},
			},
		} ) as PersistedRegistry;

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state: number | null = null ) => state,
			selectors: {
				getState: ( state: number | null ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toBe( 1 );
	} );

	it( 'should not persist if option not passed', () => {
		const initialState = { foo: 'bar', baz: 'qux' };
		function reducer(
			state = initialState,
			action: AnyAction & { nextState?: typeof initialState }
		) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			actions: {
				setState( nextState: typeof initialState ) {
					return { type: 'SET_STATE', nextState };
				},
			},
		} );

		registry.dispatch( 'test' ).setState( { ok: true } );

		expect( objectStorage.setItem ).not.toHaveBeenCalled();
	} );

	it( 'should not persist when state matches initial', () => {
		// Caveat: State is compared by strict equality. This doesn't work for
		// object types in rehydrating from persistence, since:
		//   JSON.parse( {} ) !== JSON.parse( {} )
		// It's more important for runtime to check equal-ness, which is
		// expected to be reflected even for object types by reducer.
		const state = 1;
		const reducer = () => state;

		objectStorage.setItem( 'WP_DATA', JSON.stringify( { test: state } ) );
		vi.mocked( objectStorage.setItem ).mockClear();

		registry.registerStore( 'test', {
			reducer,
			persist: true,
			actions: {
				doNothing() {
					return { type: 'NOTHING' };
				},
			},
		} );

		registry.dispatch( 'test' ).doNothing();

		expect( objectStorage.setItem ).not.toHaveBeenCalled();
	} );

	it( 'should persist when state changes', () => {
		const initialState = { foo: 'bar', baz: 'qux' };
		function reducer(
			state = initialState,
			action: AnyAction & { nextState?: Record< string, unknown > }
		) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			persist: true,
			actions: {
				setState( nextState: Record< string, unknown > ) {
					return { type: 'SET_STATE', nextState };
				},
			},
		} );

		registry.dispatch( 'test' ).setState( { ok: true } );

		expect( objectStorage.setItem ).toHaveBeenCalledWith(
			'WP_DATA',
			'{"test":{"ok":true}}'
		);
	} );

	it( 'should persist a subset of keys', () => {
		const initialState = { foo: 'bar', baz: 'qux' };
		function reducer(
			state = initialState,
			action: AnyAction & { nextState?: Record< string, unknown > }
		) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			persist: [ 'foo' ],
			actions: {
				setState( nextState: Record< string, unknown > ) {
					return { type: 'SET_STATE', nextState };
				},
			},
		} );

		registry.dispatch( 'test' ).setState( { foo: 1, baz: 2 } );

		expect( objectStorage.setItem ).toHaveBeenCalledWith(
			'WP_DATA',
			'{"test":{"foo":1}}'
		);
	} );

	it( 'should not persist an unchanging subset', () => {
		const initialState = { foo: 'bar' };
		function reducer(
			state = initialState,
			action: AnyAction & { key: string; value: number }
		) {
			const { type, key, value } = action;
			if ( type === 'SET_KEY_VALUE' ) {
				return { ...state, [ key ]: value };
			}

			return state;
		}

		registry.registerStore( 'test', {
			reducer,
			persist: [ 'foo' ],
			actions: {
				setKeyValue( key: string, value: number ) {
					return { type: 'SET_KEY_VALUE', key, value };
				},
			},
		} );

		registry.dispatch( 'test' ).setKeyValue( 'foo', 1 );
		vi.mocked( objectStorage.setItem ).mockClear();

		registry.dispatch( 'test' ).setKeyValue( 'foo', 1 );
		expect( objectStorage.setItem ).not.toHaveBeenCalled();
	} );

	describe( 'createPersistenceInterface', () => {
		const storage = objectStorage;
		const storageKey = 'FOO';

		let get: () => Record< string, unknown >;
		let set: ( key: string, value: unknown ) => void;
		beforeEach( () => {
			( { get, set } = createPersistenceInterface( {
				storage,
				storageKey,
			} ) );
		} );

		describe( 'get', () => {
			it( 'returns an empty object if not set', () => {
				const data = get();

				expect( data ).toEqual( {} );
			} );

			it( 'returns the current value', () => {
				objectStorage.setItem( storageKey, '{"test":{}}' );
				const data = get();

				expect( data ).toEqual( { test: {} } );
			} );
		} );

		describe( 'set', () => {
			it( 'sets JSON by object', () => {
				set( 'test', {} );

				expect( objectStorage.setItem ).toHaveBeenCalledWith(
					storageKey,
					'{"test":{}}'
				);
			} );

			it( 'merges to existing', () => {
				set( 'test1', {} );
				set( 'test2', {} );

				expect( objectStorage.setItem ).toHaveBeenCalledWith(
					storageKey,
					'{"test1":{}}'
				);
				expect( objectStorage.setItem ).toHaveBeenCalledWith(
					storageKey,
					'{"test1":{},"test2":{}}'
				);
			} );
		} );
	} );

	describe( 'withLazySameState', () => {
		it( 'should call the original reducer if action.nextState differs from state', () => {
			const reducer = vi
				.fn()
				.mockImplementation(
					( state: number, action: { nextState: number } ) =>
						action.nextState
				);
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 2 } );

			expect( state ).toBe( 2 );
			expect( reducer ).toHaveBeenCalled();
		} );

		it( 'should not call the original reducer if action.nextState equals state', () => {
			const reducer = vi
				.fn()
				.mockImplementation(
					( state: number, action: { nextState: number } ) =>
						action.nextState
				);
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 1 } );

			expect( state ).toBe( 1 );
			expect( reducer ).not.toHaveBeenCalled();
		} );
	} );
} );
