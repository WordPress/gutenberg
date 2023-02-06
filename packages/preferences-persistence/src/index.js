/**
 * Internal dependencies
 */
import create from './create';
import convertLegacyLocalStorageData from './migrations/legacy-local-storage-data';
import convertPreferencesPackageData from './migrations/preferences-package-data';

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
 * @param {Object} serverData Preferences data preloaded from the server.
 * @param {string} userId     The user id.
 * @param {string} blogPrefix The site prefix.
 *
 * @return {Object} The persistence layer initialized with the preloaded data.
 */
export function __unstableCreatePersistenceLayer(
	serverData,
	userId,
	blogPrefix
) {
	const localStorageRestoreKey = blogPrefix
		? `WP_PREFERENCES_USER_${ blogPrefix }_${ userId }`
		: `WP_PREFERENCES_USER_${ userId }`;
	const localData = JSON.parse(
		window.localStorage.getItem( localStorageRestoreKey )
	);

	// Date parse returns NaN for invalid input. Coerce anything invalid
	// into a conveniently comparable zero.
	const serverModified =
		Date.parse( serverData && serverData._modified ) || 0;
	const localModified = Date.parse( localData && localData._modified ) || 0;

	let preloadedData;
	if ( serverData && serverModified >= localModified ) {
		preloadedData = convertPreferencesPackageData( serverData );
	} else if ( localData ) {
		preloadedData = convertPreferencesPackageData( localData );
	} else {
		// Check if there is data in the legacy format from the old persistence system.
		preloadedData = convertLegacyLocalStorageData( userId );
	}

	return create( {
		preloadedData,
		localStorageRestoreKey,
	} );
}
