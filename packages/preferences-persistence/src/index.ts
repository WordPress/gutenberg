import create from './create';
import convertLegacyLocalStorageData from './migrations/legacy-local-storage-data';
import convertPreferencesPackageData from './migrations/preferences-package-data';
import isPreferencesData from './is-preferences-data';
import { readStoredJSON } from './local-storage';
import type {
	PersistenceLayer,
	PreferencesData,
	ScopedPreferences,
} from './types';

export { create };

export type * from './types';

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
	serverData: PreferencesData | [] | '' | false,
	userId: string | number
): PersistenceLayer {
	const localStorageRestoreKey = `WP_PREFERENCES_USER_${ userId }`;
	const serverPreferences = isPreferencesData( serverData )
		? serverData
		: null;
	const storedData = readStoredJSON( localStorageRestoreKey );
	const localData = isPreferencesData( storedData ) ? storedData : null;

	// Date parse returns NaN for invalid input. Coerce anything invalid
	// into a conveniently comparable zero.
	const serverModified =
		Date.parse( serverPreferences?._modified ?? '' ) || 0;
	const localModified = Date.parse( localData?._modified ?? '' ) || 0;

	let preloadedData;
	if ( serverPreferences && serverModified >= localModified ) {
		preloadedData = convertPreferencesPackageData(
			serverPreferences as ScopedPreferences
		);
	} else if ( localData ) {
		preloadedData = convertPreferencesPackageData(
			localData as ScopedPreferences
		);
	} else {
		// Check if there is data in the legacy format from the old persistence system.
		preloadedData = convertLegacyLocalStorageData( userId );
	}

	// `[]` is empty user meta, so the server has nothing more to fetch.
	if ( ! preloadedData && Array.isArray( serverData ) ) {
		preloadedData = {};
	}

	return create( {
		preloadedData,
		localStorageRestoreKey,
	} );
}
