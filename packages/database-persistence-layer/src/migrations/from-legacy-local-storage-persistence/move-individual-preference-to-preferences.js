const identity = ( arg ) => arg;

/**
 * Migrates an individual item inside the `preferences` object for a store.
 *
 * @param {Object}    state         The original state.
 * @param {Object}    migrate       An options object that contains details of the migration.
 * @param {string}    migrate.from  The name of the store to migrate from.
 * @param {string}    migrate.scope The scope in the preferences store to migrate to.
 * @param {string}    key           The key in the preferences object to migrate.
 * @param {?Function} convert       A function that converts preferences from one format to another.
 */
export default function moveIndividualPreferenceToPreferences(
	state,
	{ from: sourceStoreName, scope },
	key,
	convert = identity
) {
	const preferencesStoreName = 'core/preferences';
	const sourcePreference = state[ sourceStoreName ]?.preferences?.[ key ];

	// There's nothing to migrate, exit early.
	if ( sourcePreference === undefined ) {
		return state;
	}

	const targetPreference =
		state[ preferencesStoreName ]?.preferences?.[ scope ]?.[ key ];

	// There's existing data at the target, so don't overwrite it, exit early.
	if ( targetPreference ) {
		return state;
	}

	const otherScopes = state[ preferencesStoreName ]?.preferences;
	const otherPreferences =
		state[ preferencesStoreName ]?.preferences?.[ scope ];

	const otherSourceState = state[ sourceStoreName ];
	const allSourcePreferences = state[ sourceStoreName ]?.preferences;

	// Pass an object with the key and value as this allows the convert
	// function to convert to a data structure that has different keys.
	const convertedPreferences = convert( { [ key ]: sourcePreference } );

	return {
		...state,
		[ preferencesStoreName ]: {
			preferences: {
				...otherScopes,
				[ scope ]: {
					...otherPreferences,
					...convertedPreferences,
				},
			},
		},
		[ sourceStoreName ]: {
			...otherSourceState,
			preferences: {
				...allSourcePreferences,
				[ key ]: undefined,
			},
		},
	};
}
