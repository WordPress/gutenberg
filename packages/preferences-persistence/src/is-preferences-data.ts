import type { PreferencesData } from './types';

/**
 * Checks whether persisted data is a preferences object. Empty user meta
 * reaches the client as `[]` or `''`, which must not be used as preferences.
 *
 * @param data The persisted data.
 *
 * @return Whether the data is a preferences object.
 */
export default function isPreferencesData(
	data: unknown
): data is PreferencesData {
	return !! data && typeof data === 'object' && ! Array.isArray( data );
}
