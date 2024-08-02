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

		expect( set ).toHaveBeenCalledWith( state, { isExpensive: false } );
	} );

	it( 'passes the `isExpensive` flag to the persistence layer when the `MARK_NEXT_CHANGE_AS_EXPENSIVE` action is dispatched', () => {
		const set = jest.fn();
		const persistenceLayer = {
			set,
		};

		// Set the persistence layer.
		const setPersistenceLayerAction = {
			type: 'SET_PERSISTENCE_LAYER',
			persistenceLayer,
			persistedData: {},
		};
		preferences( {}, setPersistenceLayerAction );

		// Mark the next change as expensive.
		const markNextChangeAsExpensiveAction = {
			type: 'MARK_NEXT_CHANGE_AS_EXPENSIVE',
		};
		preferences( {}, markNextChangeAsExpensiveAction );

		// Update a value, and expect the persistence layer `set` function to receive the `isExpensive: true` option.
		const setPreferenceValueAction1 = {
			type: 'SET_PREFERENCE_VALUE',
			name: 'myPreference',
			value: 'myValue1',
		};
		const state1 = preferences( {}, setPreferenceValueAction1 );
		expect( set ).toHaveBeenCalledWith( state1, { isExpensive: true } );

		// Update with another value, and expect that the `isExpensive` option is `false` again.
		const setPreferenceValueAction2 = {
			type: 'SET_PREFERENCE_VALUE',
			name: 'myPreference',
			value: 'myValue2',
		};
		const state2 = preferences( {}, setPreferenceValueAction2 );
		expect( set ).toHaveBeenCalledWith( state2, { isExpensive: false } );
	} );
} );
