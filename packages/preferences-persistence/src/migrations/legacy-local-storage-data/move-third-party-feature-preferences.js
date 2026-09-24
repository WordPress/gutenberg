/**
 * The interface package previously had a public API that could be used by
 * plugins to set persisted boolean 'feature' preferences.
 *
 * While usage was likely non-existent or very small, this function ensures
 * those are migrated to the preferences data structure. The interface
 * package's APIs have now been deprecated and use the preferences store.
 *
 * This will convert data that looks like this:
 * ```js
 * {
 *     'core/interface': {
 *         preferences: {
 *             features: {
 *                 'my-plugin': {
 *                     myPluginFeature: true
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * To this:
 * ```js
 *  * {
 *     'core/preferences': {
 *         preferences: {
 *             'my-plugin': {
 *                 myPluginFeature: true
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * @param {Object} state The local storage state
 *
 * @return {Object} The state with third party preferences moved to the
 *                  preferences data structure.
 */
export default function moveThirdPartyFeaturePreferencesToPreferences( state ) {
	const interfaceStoreName = 'core/interface';
	const preferencesStoreName = 'core/preferences';

	const interfaceScopes =
		state?.[ interfaceStoreName ]?.preferences?.features;
	const interfaceScopeKeys = interfaceScopes
		? Object.keys( interfaceScopes )
		: [];

	if ( ! interfaceScopeKeys?.length ) {
		return state;
	}

	return interfaceScopeKeys.reduce( function ( convertedState, scope ) {
		if ( scope.startsWith( 'core' ) ) {
			return convertedState;
		}

		const featuresToMigrate = interfaceScopes?.[ scope ];
		if ( ! featuresToMigrate ) {
			return convertedState;
		}

		const existingMigratedData =
			convertedState?.[ preferencesStoreName ]?.preferences?.[ scope ];

		if ( existingMigratedData ) {
			return convertedState;
		}

		const otherPreferencesScopes =
			convertedState?.[ preferencesStoreName ]?.preferences;
		const otherInterfaceState = convertedState?.[ interfaceStoreName ];
		const otherInterfaceScopes =
			convertedState?.[ interfaceStoreName ]?.preferences?.features;

		return {
			...convertedState,
			[ preferencesStoreName ]: {
				preferences: {
					...otherPreferencesScopes,
					[ scope ]: featuresToMigrate,
				},
			},
			[ interfaceStoreName ]: {
				...otherInterfaceState,
				preferences: {
					features: {
						...otherInterfaceScopes,
						[ scope ]: undefined,
					},
				},
			},
		};
	}, state );
}
