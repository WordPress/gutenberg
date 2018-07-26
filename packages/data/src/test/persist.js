/**
 * Internal dependencies
 */
import { getPersistenceStorage, setPersistenceStorage, restrictPersistence } from '../persist';
import { createRegistry } from '../registry';

describe( 'persiss registry', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		setPersistenceStorage( window.localStorage );
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

	it( 'should not trigger persistence if the value doesn’t change', () => {
		const storageKey = 'dumbStorageKey2';
		let countCalls = 0;
		const storage = {
			getItem() {
				return this.item;
			},
			setItem( key, value ) {
				countCalls++;
				this.item = value;
			},
		};
		setPersistenceStorage( storage );
		const reducer = ( state = { ribs: true }, action ) => {
			if ( action.type === 'UPDATE' ) {
				return { chicken: true };
			}

			return state;
		};
		registry.registerStore( 'store1', {
			reducer,
			persist: true,
			actions: {
				update: () => ( { type: 'UPDATE' } ),
			},
		} );
		registry.registerStore( 'store2', {
			reducer,
			actions: {
				update: () => ( { type: 'UPDATE' } ),
			},
		} );
		registry.setupPersistence( storageKey );

		expect( countCalls ).toBe( 1 ); // Setup trigger initial persistence.

		registry.dispatch( 'store1' ).update();

		expect( countCalls ).toBe( 2 ); // Updating state trigger persistence.

		registry.dispatch( 'store2' ).update();

		expect( countCalls ).toBe( 2 ); // If the persisted state doesn't change, don't persist.
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
