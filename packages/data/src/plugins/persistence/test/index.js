/**
 * Internal dependencies
 */
import plugin, {
	createPersistenceInterface,
	withInitialState,
	withLazySameState,
} from '../';
import objectStorage from '../storage/object';
import { createRegistry } from '../../../';

describe( 'persistence', () => {
	let registry, originalRegisterStore;

	beforeAll( () => {
		jest.spyOn( objectStorage, 'setItem' );
	} );

	beforeEach( () => {
		objectStorage.clear();
		objectStorage.setItem.mockClear();

		// Since the exposed `registerStore` is a proxying function, mimic
		// intercept of original call by adding an initial plugin.
		// TODO: Remove the `use` function in favor of `registerGenericStore`
		registry = createRegistry()
			.use( ( originalRegistry ) => {
				originalRegisterStore = jest.spyOn( originalRegistry, 'registerStore' );
				return {};
			} )
			.use( plugin, { storage: objectStorage } );
	} );

	it( 'should not mutate options', () => {
		const options = Object.freeze( { persist: true, reducer() {} } );

		registry.registerStore( 'test', options );
	} );

	it( 'override values passed to registerStore', () => {
		const options = { persist: true, reducer() {} };

		registry.registerStore( 'test', options );

		expect( originalRegisterStore ).toHaveBeenCalledWith( 'test', {
			persist: true,
			reducer: expect.any( Function ),
		} );
		// Replaced reducer:
		expect( originalRegisterStore.mock.calls[ 0 ][ 1 ].reducer ).not.toBe( options.reducer );
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

		expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test":{"ok":true}}' );
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

		expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test":{"foo":1}}' );
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
			( { get, set } = createPersistenceInterface( { storage, storageKey } ) );
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

				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test":{}}' );
			} );

			it( 'merges to existing', () => {
				set( 'test1', {} );
				set( 'test2', {} );

				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test1":{}}' );
				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test1":{},"test2":{}}' );
			} );
		} );
	} );

	describe( 'withInitialState', () => {
		it( 'should return a reducer function', () => {
			const reducer = ( state = 1 ) => state;
			const enhanced = withInitialState( reducer );

			expect( enhanced() ).toBe( 1 );
		} );

		it( 'should assign a default state by argument', () => {
			const reducer = ( state = 1 ) => state;
			const enhanced = withInitialState( reducer, 2 );

			expect( enhanced() ).toBe( 2 );
		} );
	} );

	describe( 'withLazySameState', () => {
		it( 'should call the original reducer if action.nextState differs from state', () => {
			const reducer = jest.fn().mockImplementation( ( state, action ) => action.nextState );
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 2 } );

			expect( state ).toBe( 2 );
			expect( reducer ).toHaveBeenCalled();
		} );

		it( 'should not call the original reducer if action.nextState equals state', () => {
			const reducer = jest.fn().mockImplementation( ( state, action ) => action.nextState );
			const enhanced = withLazySameState( reducer );

			reducer.mockClear();

			const state = enhanced( 1, { nextState: 1 } );

			expect( state ).toBe( 1 );
			expect( reducer ).not.toHaveBeenCalled();
		} );
	} );
} );
