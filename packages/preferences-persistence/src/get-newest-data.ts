import isPreferencesData from './is-preferences-data';
import { readStoredJSON } from './local-storage';
import convertPreferencesPackageData from './migrations/preferences-package-data';
import type { PreferencesData, ScopedPreferences } from './types';

/**
 * Picks the most recently modified preferences from the server data and the
 * local storage backup, ignoring either when it is not a preferences object.
 *
 * @param serverData             Preferences data from the server.
 * @param localStorageRestoreKey The key of the local storage backup.
 *
 * @return The newest preferences data, or `null` when neither is valid.
 */
function pickNewestData(
	serverData: unknown,
	localStorageRestoreKey: string
): PreferencesData | null {
	const storedData = readStoredJSON( localStorageRestoreKey );
	const localData = isPreferencesData( storedData ) ? storedData : null;
	if ( ! isPreferencesData( serverData ) ) {
		return localData;
	}

	// Date parse returns NaN for invalid input. Coerce anything invalid
	// into a conveniently comparable zero.
	const serverModified = Date.parse( serverData._modified ?? '' ) || 0;
	const localModified = Date.parse( localData?._modified ?? '' ) || 0;

	// Prefer server data when it is at least as recent.
	return localData && localModified > serverModified ? localData : serverData;
}

/**
 * Gets the newest persisted preferences, migrated to the current format.
 *
 * @param serverData             Preferences data from the server.
 * @param localStorageRestoreKey The key of the local storage backup.
 *
 * @return The migrated preferences, or `undefined` when there are none.
 */
export default function getNewestData(
	serverData: unknown,
	localStorageRestoreKey: string
): ScopedPreferences | undefined {
	const newestData = pickNewestData( serverData, localStorageRestoreKey );
	return newestData
		? convertPreferencesPackageData( newestData as ScopedPreferences )
		: undefined;
}
