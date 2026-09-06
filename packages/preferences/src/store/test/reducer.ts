import { describe, expect, it, vi } from 'vitest';
import { preferences } from '../reducer';

describe( 'withPersistenceLayer( preferences )', () => {
	it( 'updates the store state to the persisted data when called with the `SET_PERSISTENCE_LAYER` action', () => {
		const persistedData = {
			a: 1,
			b: 2,
		};

		const action = {
			type: 'SET_PERSISTENCE_LAYER',
			persistenceLayer: {
				get: async () => persistedData,
				set() {},
			},
			persistedData,
		} as const;

		expect( preferences( {}, action ) ).toEqual( persistedData );
	} );

	it( 'calls the persistence layer `set` function with the updated store state whenever the `SET_PREFERENCE_VALUE` action is dispatched', () => {
		const set = vi.fn();
		const persistenceLayer = {
			get: async () => ( {} ),
			set,
		};

		const setPersistenceLayerAction = {
			type: 'SET_PERSISTENCE_LAYER',
			persistenceLayer,
			persistedData: {},
		} as const;

		// Set the persistence layer.
		preferences( {}, setPersistenceLayerAction );

		// Update a value.
		const setPreferenceValueAction = {
			type: 'SET_PREFERENCE_VALUE',
			scope: 'test-scope',
			name: 'myPreference',
			value: 'myValue',
		} as const;

		const state = preferences( {}, setPreferenceValueAction );

		expect( set ).toHaveBeenCalledWith( state );
	} );
} );
