/**
 * Reads and parses a JSON value from local storage.
 *
 * @param key The local storage key.
 *
 * @return The parsed value, or `null` when the value is missing or invalid,
 *         or local storage is unavailable.
 */
export function readStoredJSON( key: string ): unknown {
	try {
		const value = window.localStorage.getItem( key );
		return value === null ? null : JSON.parse( value );
	} catch {
		return null;
	}
}

/**
 * Stores a value in local storage as JSON.
 *
 * Failures, such as blocked storage or an exceeded quota, are ignored.
 *
 * @param key   The local storage key.
 * @param value The value to store.
 */
export function writeStoredJSON( key: string, value: unknown ) {
	try {
		window.localStorage.setItem( key, JSON.stringify( value ) );
	} catch {}
}
