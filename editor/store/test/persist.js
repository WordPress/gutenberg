/**
 * External dependencies
 */
import { createStore } from 'redux';

/**
 * Internal dependencies
 */
import { loadAndPersist, withRehydratation } from '../persist';

describe( 'loadAndPersist', () => {
	it( 'should load the initial value from the local storage', () => {
		const storageKey = 'dumbStorageKey';
		window.localStorage.setItem( storageKey, JSON.stringify( { chicken: true } ) );
		const reducer = () => {
			return {
				preferences: { ribs: true },
			};
		};
		const store = createStore( withRehydratation( reducer, 'preferences' ) );
		loadAndPersist(
			store,
			'preferences',
			storageKey,
		);
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
		const store = createStore( withRehydratation( reducer, 'preferences' ) );
		loadAndPersist(
			store,
			'preferences',
			storageKey,
		);
		store.dispatch( { type: 'UPDATE' } );
		expect( JSON.parse( window.localStorage.getItem( storageKey ) ) ).toEqual( { chicken: true } );
	} );

	it( 'should apply defaults to any missing properties on previously stored objects', () => {
		const defaultsPreferences = {
			counter: 41,
		};
		const storageKey = 'dumbStorageKey3';
		const reducer = ( state, action ) => {
			if ( action.type === 'INCREMENT' ) {
				return {
					preferences: { counter: state.preferences.counter + 1 },
				};
			}
			return {
				preferences: { counter: 0 },
			};
		};

		// store preferences without the `counter` default
		window.localStorage.setItem( storageKey, JSON.stringify( {} ) );

		const store = createStore( withRehydratation( reducer, 'preferences' ) );
		loadAndPersist(
			store,
			'preferences',
			storageKey,
			defaultsPreferences,
		);
		store.dispatch( { type: 'INCREMENT' } );

		// the default should have been applied, as the `counter` was missing from the
		// saved preferences, then the INCREMENT action should have taken effect to give us 42
		expect( JSON.parse( window.localStorage.getItem( storageKey ) ) ).toEqual( { counter: 42 } );
	} );

	it( 'should not override stored values with defaults', () => {
		const defaultsPreferences = {
			counter: 41,
		};
		const storageKey = 'dumbStorageKey4';
		const reducer = ( state, action ) => {
			if ( action.type === 'INCREMENT' ) {
				return {
					preferences: { counter: state.preferences.counter + 1 },
				};
			}
			return {
				preferences: { counter: 0 },
			};
		};

		window.localStorage.setItem( storageKey, JSON.stringify( { counter: 1 } ) );

		const store = createStore( withRehydratation( reducer, 'preferences' ) );

		loadAndPersist(
			store,
			'preferences',
			storageKey,
			defaultsPreferences,
		);
		store.dispatch( { type: 'INCREMENT' } );

		expect( JSON.parse( window.localStorage.getItem( storageKey ) ) ).toEqual( { counter: 2 } );
	} );
} );
