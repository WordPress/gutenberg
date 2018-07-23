/**
 * Internal dependencies
 */
import { getPersistenceStorage, restrictPersistence } from '../persist';
import { createRegistry } from '../registry';

describe( 'persiss registry', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'should load the initial value from the local storage integrating it into reducer default value.', () => {
		const storageKey = 'dumbStorageKey';
		const store = registry.registerStore( 'storeKey', {
			reducer: ( state = { ribs: true } ) => {
				return state;
			},
			persist: true,
		} );

		getPersistenceStorage().setItem( storageKey, JSON.stringify( {
			storeKey: {
				chicken: true,
			},
		} ) );

		registry.setupPersistence( storageKey );

		expect( store.getState() ).toEqual( { chicken: true, ribs: true } );
	} );

	it( 'should persist to local storage once the state value changes', () => {
		const storageKey = 'dumbStorageKey2';
		const reducer = ( state, action ) => {
			if ( action.type === 'SERIALIZE' ) {
				return state;
			}

			if ( action.type === 'UPDATE' ) {
				return { chicken: true };
			}

			return { ribs: true };
		};
		const store = registry.registerStore( 'storeKey', {
			reducer,
			persist: true,
		} );

		registry.setupPersistence( storageKey );

		store.dispatch( { type: 'UPDATE' } );
		expect( JSON.parse( getPersistenceStorage().getItem( storageKey ) ) )
			.toEqual( { storeKey: { chicken: true } } );
	} );
} );

describe( 'restrictPersistence', () => {
	it( 'should only serialize a sub reducer state', () => {
		const reducer = restrictPersistence( () => {
			return {
				preferences: {
					chicken: 'ribs',
				},

				a: 'b',
			};
		}, 'preferences' );

		expect( reducer( undefined, { type: 'SERIALIZE' } ) ).toEqual( {
			preferences: {
				chicken: 'ribs',
			},
		} );
	} );

	it( 'should merge the substate with the default value', () => {
		const reducer = restrictPersistence( () => {
			return {
				preferences: {
					chicken: true,
				},

				a: 'b',
			};
		}, 'preferences' );
		const state = reducer( undefined, { type: '@@init' } );
		expect( reducer( {
			preferences: {
				ribs: true,
			},
		}, {
			type: 'REDUX_REHYDRATE',
			previousState: state,
		} ) ).toEqual( {
			a: 'b',
			preferences: {
				chicken: true,
				ribs: true,
			},
		} );
	} );
} );
