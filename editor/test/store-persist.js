/**
 * External dependencies
 */
import { createStore } from 'redux';

/**
 * Internal dependencies
 */
import persistStore from '../store-persist';

describe( 'persistStore', () => {
	it( 'should load the initial value from the local storage', () => {
		const storageKey = 'dumbStorageKey';
		window.localStorage.setItem( storageKey, JSON.stringify( { chicken: true } ) );
		const reducer = () => {
			return {
				preferences: { ribs: true },
			};
		};
		const store = createStore( reducer, persistStore( 'preferences', storageKey ) );
		expect( store.getState().preferences ).toEqual( { chicken: true } );
	} );

	it( 'should persit to local storage once the state value changes', () => {
		const storageKey = 'dumbStorageKey2';
		const reducer = ( state, action ) => {
			if ( action.type === 'UPDATE' ) {
				return {
					preferences: { chicken: true },
				};
			}

			return {
				preferences: { ribs: true },
			};
		};
		const store = createStore( reducer, persistStore( 'preferences', storageKey ) );
		store.dispatch( { type: 'UPDATE' } );
		expect( JSON.parse( window.localStorage.getItem( storageKey ) ) ).toEqual( { chicken: true } );
	} );
} );
