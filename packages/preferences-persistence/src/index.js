/**
 * Internal dependencies
 */
import create from './create';
import {
	getLegacyData,
	convertLegacyData,
	convertLegacyInsertUsageData,
} from './migrations/legacy-local-storage-data';
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
 *
 * @return {Object} The persistence layer initialized with the preloaded data.
 */
export function __unstableCreatePersistenceLayer( serverData, userId ) {
	const localStorageRestoreKey = `WP_PREFERENCES_USER_${ userId }`;
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
	}

	// Handle legacy data migrations.
	if ( ! preloadedData ) {
		// Check if there is data in the legacy format from the old persistence system.
		const legacyData = getLegacyData( userId );
		preloadedData = convertLegacyData( legacyData );
	}

	// The insertUsage preference was migrated later than others, the following code
	// performs a separate migration just for this data.
	if ( preloadedData && ! preloadedData?.core?.insertUsage ) {
		const legacyData = getLegacyData( userId );

		// Only run the migration if there's something to migrate.
		if ( legacyData?.[ 'core/block-editor' ]?.preferences?.insertUsage ) {
			// Check if there is data in the legacy format from the old persistence system.
			preloadedData = {
				...preloadedData,
				core: {
					...preloadedData.core,
					insertUsage: convertLegacyInsertUsageData( legacyData ),
				},
			};
		}
	}

	return create( {
		preloadedData,
		localStorageRestoreKey,
	} );
}
