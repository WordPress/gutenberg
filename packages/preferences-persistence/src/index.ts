import create from './create';
import convertLegacyLocalStorageData from './migrations/legacy-local-storage-data';
import convertPreferencesPackageData from './migrations/preferences-package-data';
import type {
	PersistenceLayer,
	PreferencesData,
	ScopedPreferences,
} from './types';

export { create };

/**
 * Creates the persistence layer with preloaded data.
 *
 * It prioritizes any data from the server, but falls back first to localStorage
 * restore data, and then to any legacy data.
 *
 * This function is used internally by WordPress in an inline script, so
 * prefixed with `__unstable`.
 *
 * @param serverData Preferences data preloaded from the server.
 * @param userId     The user id.
 *
 * @return The persistence layer initialized with the preloaded data.
 */
export function __unstableCreatePersistenceLayer(
	serverData: PreferencesData | '' | false,
	userId: string
): PersistenceLayer {
	const localStorageRestoreKey = `WP_PREFERENCES_USER_${ userId }`;
	const localData: PreferencesData | null = JSON.parse(
		window.localStorage.getItem( localStorageRestoreKey ) as string
	);

	// Date parse returns NaN for invalid input. Coerce anything invalid
	// into a conveniently comparable zero.
	const serverModified =
		Date.parse( ( serverData && serverData._modified ) as string ) || 0;
	const localModified =
		Date.parse( ( localData && localData._modified ) as string ) || 0;

	let preloadedData;
	if ( serverData && serverModified >= localModified ) {
		preloadedData = convertPreferencesPackageData(
			serverData as ScopedPreferences
		);
	} else if ( localData ) {
		preloadedData = convertPreferencesPackageData(
			localData as ScopedPreferences
		);
	} else {
		// Check if there is data in the legacy format from the old persistence system.
		preloadedData = convertLegacyLocalStorageData( userId );
	}

	return create( {
		preloadedData,
		localStorageRestoreKey,
	} );
}
