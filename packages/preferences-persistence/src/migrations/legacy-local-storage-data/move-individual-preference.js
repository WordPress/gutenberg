const identity = ( arg ) => arg;

/**
 * Migrates an individual item inside the `preferences` object for a package's store.
 *
 * Previously, some packages had individual 'preferences' of any data type, and many used
 * complex nested data structures. For example:
 * ```js
 * {
 *     'core/edit-post': {
 *         preferences: {
 *             panels: {
 *                 publish: {
 *                     opened: true,
 *                     enabled: true,
 *                 }
 *             },
 *             // ...other preferences.
 *         },
 *     },
 * }
 *
 * This function supports moving an individual preference like 'panels' above into the
 * preferences package data structure.
 *
 * It supports moving a preference to a particular scope in the preferences store and
 * optionally converting the data using a `convert` function.
 *
 * ```
 *
 * @param {Object}    state        The original state.
 * @param {Object}    migrate      An options object that contains details of the migration.
 * @param {string}    migrate.from The name of the store to migrate from.
 * @param {string}    migrate.to   The scope in the preferences store to migrate to.
 * @param {string}    key          The key in the preferences object to migrate.
 * @param {?Function} convert      A function that converts preferences from one format to another.
 */
export default function moveIndividualPreferenceToPreferences(
	state,
	{ from: sourceStoreName, to: scope },
	key,
	convert = identity
) {
	const preferencesStoreName = 'core/preferences';
	const sourcePreference = state?.[ sourceStoreName ]?.preferences?.[ key ];

	// There's nothing to migrate, exit early.
	if ( sourcePreference === undefined ) {
		return state;
	}

	const targetPreference =
		state?.[ preferencesStoreName ]?.preferences?.[ scope ]?.[ key ];

	// There's existing data at the target, so don't overwrite it, exit early.
	if ( targetPreference ) {
		return state;
	}

	const otherScopes = state?.[ preferencesStoreName ]?.preferences;
	const otherPreferences =
		state?.[ preferencesStoreName ]?.preferences?.[ scope ];

	const otherSourceState = state?.[ sourceStoreName ];
	const allSourcePreferences = state?.[ sourceStoreName ]?.preferences;

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
