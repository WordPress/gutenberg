import type { ScopePreferences } from '../../types';
import type { LegacyData } from './types';

const identity = < T >( arg: T ) => arg;

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
 * @param state        The original state.
 * @param migrate      An options object that contains details of the migration.
 * @param migrate.from The name of the store to migrate from.
 * @param migrate.to   The scope in the preferences store to migrate to.
 * @param key          The key in the preferences object to migrate.
 * @param convert      A function that converts preferences from one format to another.
 */
export default function moveIndividualPreferenceToPreferences(
	state: LegacyData,
	{ from: sourceStoreName, to: scope }: { from: string; to: string },
	key: string,
	convert: ( preferences: ScopePreferences ) => object = identity
): LegacyData {
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
