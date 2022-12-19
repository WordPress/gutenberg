/**
 * Move the 'features' object in local storage from the sourceStoreName to the
 * preferences store data structure.
 *
 * Previously, editors used a data structure like this for feature preferences:
 * ```js
 * {
 *     'core/edit-post': {
 *         preferences: {
 *             features; {
 *                 topToolbar: true,
 *                 // ... other boolean 'feature' preferences
 *             },
 *         },
 *     },
 * }
 * ```
 *
 * And for a while these feature preferences lived in the interface package:
 * ```js
 * {
 *     'core/interface': {
 *         preferences: {
 *             features: {
 *                 'core/edit-post': {
 *                     topToolbar: true
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * In the preferences store, 'features' aren't considered special, they're
 * merged to the root level of the scope along with other preferences:
 * ```js
 * {
 *     'core/preferences': {
 *         preferences: {
 *             'core/edit-post': {
 *                 topToolbar: true,
 *                 // ... any other preferences.
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * This function handles moving from either the source store or the interface
 * store to the preferences data structure.
 *
 * @param {Object} state           The state before migration.
 * @param {string} sourceStoreName The name of the store that has persisted
 *                                 preferences to migrate to the preferences
 *                                 package.
 * @return {Object} The migrated state
 */
export default function moveFeaturePreferences( state, sourceStoreName ) {
	const preferencesStoreName = 'core/preferences';
	const interfaceStoreName = 'core/interface';

	// Features most recently (and briefly) lived in the interface package.
	// If data exists there, prioritize using that for the migration. If not
	// also check the original package as the user may have updated from an
	// older block editor version.
	const interfaceFeatures =
		state?.[ interfaceStoreName ]?.preferences?.features?.[
			sourceStoreName
		];
	const sourceFeatures = state?.[ sourceStoreName ]?.preferences?.features;
	const featuresToMigrate = interfaceFeatures
		? interfaceFeatures
		: sourceFeatures;

	if ( ! featuresToMigrate ) {
		return state;
	}

	const existingPreferences = state?.[ preferencesStoreName ]?.preferences;

	// Avoid migrating features again if they've previously been migrated.
	if ( existingPreferences?.[ sourceStoreName ] ) {
		return state;
	}

	let updatedInterfaceState;
	if ( interfaceFeatures ) {
		const otherInterfaceState = state?.[ interfaceStoreName ];
		const otherInterfaceScopes =
			state?.[ interfaceStoreName ]?.preferences?.features;

		updatedInterfaceState = {
			[ interfaceStoreName ]: {
				...otherInterfaceState,
				preferences: {
					features: {
						...otherInterfaceScopes,
						[ sourceStoreName ]: undefined,
					},
				},
			},
		};
	}

	let updatedSourceState;
	if ( sourceFeatures ) {
		const otherSourceState = state?.[ sourceStoreName ];
		const sourcePreferences = state?.[ sourceStoreName ]?.preferences;

		updatedSourceState = {
			[ sourceStoreName ]: {
				...otherSourceState,
				preferences: {
					...sourcePreferences,
					features: undefined,
				},
			},
		};
	}

	// Set the feature values in the interface store, the features
	// object is keyed by 'scope', which matches the store name for
	// the source.
	return {
		...state,
		[ preferencesStoreName ]: {
			preferences: {
				...existingPreferences,
				[ sourceStoreName ]: featuresToMigrate,
			},
		},
		...updatedInterfaceState,
		...updatedSourceState,
	};
}
