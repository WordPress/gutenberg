export default function moveThirdPartyFeaturePreferencesToPreferences( state ) {
	const interfaceStoreName = 'core/interface';
	const preferencesStoreName = 'core/preferences';

	const interfaceScopes = state[ interfaceStoreName ]?.preferences?.features;
	const interfaceScopeKeys = Object.keys( interfaceScopes );

	if ( ! interfaceScopeKeys?.length ) {
		return state;
	}

	return interfaceScopeKeys.reduce( function ( convertedState, scope ) {
		if ( scope.startsWith( 'core' ) ) {
			return convertedState;
		}

		const featuresToMigrate = interfaceScopes[ scope ];
		if ( ! featuresToMigrate ) {
			return convertedState;
		}

		const existingMigratedData =
			convertedState[ preferencesStoreName ]?.preferences?.[ scope ];

		if ( existingMigratedData ) {
			return convertedState;
		}

		const otherPreferencesScopes =
			convertedState[ preferencesStoreName ]?.preferences;
		const otherInterfaceState = convertedState[ interfaceStoreName ];
		const otherInterfaceScopes =
			convertedState[ interfaceStoreName ]?.preferences?.features;

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
