/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import plugin, {
	createPersistenceInterface,
	withLazySameState,
	migrateFeaturePreferencesToPreferencesStore,
	migrateThirdPartyFeaturePreferencesToPreferencesStore,
	migrateIndividualPreferenceToPreferencesStore,
} from '../';
import objectStorage from '../storage/object';
import { createRegistry } from '../../../';

describe( 'persistence', () => {
	let registry;

	beforeAll( () => {
		jest.spyOn( objectStorage, 'setItem' );
	} );

	beforeEach( () => {
		objectStorage.clear();
		objectStorage.setItem.mockClear();

		// TODO: Remove the `use` function in favor of `registerGenericStore`
		registry = createRegistry().use( plugin, { storage: objectStorage } );
	} );

	it( 'should not mutate options', () => {
		const options = Object.freeze( { persist: true, reducer() {} } );

		registry.registerStore( 'test', options );
	} );

	it( 'should load a persisted value as initialState', () => {
		registry = createRegistry().use( plugin, {
			storage: {
				getItem: () => JSON.stringify( { test: { a: 1 } } ),
				setItem() {},
			},
		} );

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
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
		} );

		registry.registerStore( 'test', {
			persist: [ 'a' ],
			reducer: ( state = DEFAULT_STATE ) => state,
			selectors: {
				getState: ( state ) => state,
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
		} );

		registry.registerStore( 'test', {
			persist: [ 'preferences' ],
			reducer: ( state = DEFAULT_STATE ) => state,
			selectors: {
				getState: ( state ) => state,
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
		} );

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state = null ) => state,
			selectors: {
				getState: ( state ) => state,
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
		} );

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
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
		} );

		registry.registerStore( 'test', {
			persist: true,
			reducer: ( state = null ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		expect( registry.select( 'test' ).getState() ).toBe( 1 );
	} );

	it( 'should not persist if option not passed', () => {
		const initialState = { foo: 'bar', baz: 'qux' };
		function reducer( state = initialState, action ) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			actions: {
				setState( nextState ) {
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
		objectStorage.setItem.mockClear();

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
		function reducer( state = initialState, action ) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			persist: true,
			actions: {
				setState( nextState ) {
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
		function reducer( state = initialState, action ) {
			return action.nextState || state;
		}

		registry.registerStore( 'test', {
			reducer,
			persist: [ 'foo' ],
			actions: {
				setState( nextState ) {
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
		function reducer( state = initialState, action ) {
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
				setKeyValue( key, value ) {
					return { type: 'SET_KEY_VALUE', key, value };
				},
			},
		} );

		registry.dispatch( 'test' ).setKeyValue( 'foo', 1 );
		objectStorage.setItem.mockClear();

		registry.dispatch( 'test' ).setKeyValue( 'foo', 1 );
		expect( objectStorage.setItem ).not.toHaveBeenCalled();
	} );

	describe( 'createPersistenceInterface', () => {
		const storage = objectStorage;
		const storageKey = 'FOO';

		let get, set;
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
			const reducer = jest
				.fn()
				.mockImplementation( ( state, action ) => action.nextState );
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 2 } );

			expect( state ).toBe( 2 );
			expect( reducer ).toHaveBeenCalled();
		} );

		it( 'should not call the original reducer if action.nextState equals state', () => {
			const reducer = jest
				.fn()
				.mockImplementation( ( state, action ) => action.nextState );
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 1 } );

			expect( state ).toBe( 1 );
			expect( reducer ).not.toHaveBeenCalled();
		} );
	} );
} );

describe( 'migrateFeaturePreferencesToPreferencesStore', () => {
	it( 'migrates multiple preferences from persisted source stores to preferences', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const sourceStateA = {
			preferences: {
				features: {
					featureA: true,
					featureB: false,
					featureC: true,
				},
			},
		};

		const sourceStateB = {
			preferences: {
				features: {
					featureD: true,
					featureE: false,
					featureF: true,
				},
			},
		};

		persistenceInterface.set( 'core/test-a', sourceStateA );
		persistenceInterface.set( 'core/test-b', sourceStateB );

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-a'
		);

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-b'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'core/test-b': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
			'core/test-a': {
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				preferences: {
					features: undefined,
				},
			},
		} );
	} );

	it( 'migrates multiple preferences from the persisted interface store to preferences, with interface state taking precedence over source stores', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const sourceStateA = {
			preferences: {
				features: {
					featureA: true,
					featureB: false,
					featureC: true,
				},
			},
		};

		const sourceStateB = {
			preferences: {
				features: {
					featureD: true,
					featureE: false,
					featureF: true,
				},
			},
		};

		const interfaceState = {
			preferences: {
				features: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
					'core/test-b': {
						featureJ: true,
						featureK: false,
						featureL: true,
					},
				},
			},
		};

		persistenceInterface.set( 'core/test-a', sourceStateA );
		persistenceInterface.set( 'core/test-b', sourceStateB );
		persistenceInterface.set( 'core/interface', interfaceState );

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-a'
		);

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-b'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
					'core/test-b': {
						featureJ: true,
						featureK: false,
						featureL: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'core/test-a': undefined,
						'core/test-b': undefined,
					},
				},
			},
			'core/test-a': {
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				preferences: {
					features: undefined,
				},
			},
		} );
	} );

	it( 'only migrates persisted data for the source name from source stores', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const sourceStateA = {
			preferences: {
				features: {
					featureA: true,
					featureB: false,
					featureC: true,
				},
			},
		};

		const sourceStateB = {
			preferences: {
				features: {
					featureD: true,
					featureE: false,
					featureF: true,
				},
			},
		};

		persistenceInterface.set( 'core/test-a', sourceStateA );
		persistenceInterface.set( 'core/test-b', sourceStateB );

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-a'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/test-a': {
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				preferences: {
					features: {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		} );
	} );

	it( 'only migrates persisted data for the source name from interface', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const interfaceState = {
			preferences: {
				features: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
					'core/test-b': {
						featureJ: true,
						featureK: false,
						featureL: true,
					},
				},
			},
		};

		persistenceInterface.set( 'core/interface', interfaceState );

		migrateFeaturePreferencesToPreferencesStore(
			persistenceInterface,
			'core/test-a'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'core/test-a': undefined,
						'core/test-b': {
							featureJ: true,
							featureK: false,
							featureL: true,
						},
					},
				},
			},
		} );
	} );
} );

describe( 'migrateIndividualPreferenceToPreferencesStore', () => {
	it( 'migrates an individual preference from the source to the preferences store', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const initialState = {
			preferences: {
				myPreference: '123',
			},
		};

		persistenceInterface.set( 'core/test', initialState );

		migrateIndividualPreferenceToPreferencesStore(
			persistenceInterface,
			'core/test',
			'myPreference'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test': {
						myPreference: '123',
					},
				},
			},
			'core/test': {
				preferences: {
					myPreference: undefined,
				},
			},
		} );
	} );

	it( 'does not overwrite other preferences in the preferences store', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const initialState = {
			preferences: {
				myPreference: '123',
			},
		};

		persistenceInterface.set( 'core/test', initialState );
		persistenceInterface.set( 'core/preferences', {
			preferences: {
				'core/other-store': {
					preferenceA: 1,
					preferenceB: 2,
				},
				'core/test': {
					unrelatedPreference: 'unrelated-value',
				},
			},
		} );

		migrateIndividualPreferenceToPreferencesStore(
			persistenceInterface,
			'core/test',
			'myPreference'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/other-store': {
						preferenceA: 1,
						preferenceB: 2,
					},
					'core/test': {
						unrelatedPreference: 'unrelated-value',
						myPreference: '123',
					},
				},
			},
			'core/test': {
				preferences: {
					myPreference: undefined,
				},
			},
		} );
	} );

	it( 'does not migrate data if there is already a matching preference key at the target', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		persistenceInterface.set( 'core/test', {
			preferences: {
				myPreference: '123',
			},
		} );

		persistenceInterface.set( 'core/preferences', {
			preferences: {
				'core/test': {
					myPreference: 'already-set',
				},
			},
		} );

		migrateIndividualPreferenceToPreferencesStore(
			persistenceInterface,
			'core/test',
			'myPreference'
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test': {
						myPreference: 'already-set',
					},
				},
			},
			'core/test': {
				preferences: {
					myPreference: '123',
				},
			},
		} );
	} );
} );

describe( 'migrateThirdPartyFeaturePreferencesToPreferencesStore', () => {
	it( 'migrates multiple scopes from the interface package to the preferences package', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const interfaceState = {
			preferences: {
				features: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'plugin-b': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		};
		persistenceInterface.set( 'core/interface', interfaceState );

		migrateThirdPartyFeaturePreferencesToPreferencesStore(
			persistenceInterface
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'plugin-b': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'plugin-a': undefined,
						'plugin-b': undefined,
					},
				},
			},
		} );
	} );

	it( 'ignores any core scopes', () => {
		const persistenceInterface = createPersistenceInterface( {
			storageKey: 'test-username',
		} );

		const interfaceState = {
			preferences: {
				features: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'core/edit-post': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		};
		persistenceInterface.set( 'core/interface', interfaceState );

		migrateThirdPartyFeaturePreferencesToPreferencesStore(
			persistenceInterface
		);

		expect( persistenceInterface.get() ).toEqual( {
			'core/preferences': {
				preferences: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'plugin-a': undefined,
						'core/edit-post': {
							featureD: true,
							featureE: false,
							featureF: true,
						},
					},
				},
			},
		} );
	} );
} );
