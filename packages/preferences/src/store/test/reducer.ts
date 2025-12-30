/**
 * Internal dependencies
 */
import { preferences } from '../reducer';

describe( 'withPersistenceLayer( preferences )', () => {
	it( 'updates the store state to the persisted data when called with the `SET_PERSISTENCE_LAYER` action', () => {
		const persistedData = {
			a: 1,
			b: 2,
		};

		const action = {
			type: 'SET_PERSISTENCE_LAYER',
			persistedData,
		};

		expect( preferences( {}, action ) ).toEqual( persistedData );
	} );

	it( 'calls the persistence layer `set` function with the updated store state whenever the `SET_PREFERENCE_VALUE` action is dispatched', () => {
		const set = jest.fn();
		const persistenceLayer = {
			set,
		};

		const setPersistenceLayerAction = {
			type: 'SET_PERSISTENCE_LAYER',
			persistenceLayer,
			persistedData: {},
		};

		// Set the persistence layer.
		preferences( {}, setPersistenceLayerAction );

		// Update a value.
		const setPreferenceValueAction = {
			type: 'SET_PREFERENCE_VALUE',
			name: 'myPreference',
			value: 'myValue',
		};

		const state = preferences( {}, setPreferenceValueAction );

		expect( set ).toHaveBeenCalledWith( state );
	} );
} );
