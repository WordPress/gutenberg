import create from './create';
import convertLegacyLocalStorageData from './migrations/legacy-local-storage-data';
import getNewestData from './get-newest-data';
import type { PersistenceLayer } from './types';

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
	serverData: unknown,
	userId: string | number
): PersistenceLayer {
	const localStorageRestoreKey = `WP_PREFERENCES_USER_${ userId }`;
	return create( {
		/*
		 * Fall back to data in the legacy format from the old persistence system.
		 * The server data is already preloaded, so fetching it again is redundant.
		 */
		preloadedData:
			getNewestData( serverData, localStorageRestoreKey ) ??
			convertLegacyLocalStorageData( userId ) ??
			{},
		localStorageRestoreKey,
	} );
}
