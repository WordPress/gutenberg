/**
 * Load data from localStorage with error handling
 * @param key          - The localStorage key to read from
 * @param defaultValue - The default value to return if loading fails or key doesn't exist
 * @return The parsed data from localStorage or the default value
 */
export const loadFromLocalStorage = < T >(
	key: string,
	defaultValue: T
): T => {
	try {
		const saved = window?.localStorage?.getItem( key );
		if ( saved ) {
			const parsed = JSON.parse( saved ) as T;
			// If the parsed value is an object (and not null or array), merge with defaultValue
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				! Array.isArray( parsed )
			) {
				return { ...defaultValue, ...( parsed as Partial< T > ) };
			}
			// For primitive values (string, number, boolean, null), return directly
			return parsed;
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Failed to load data from localStorage (key: ${ key }):`,
			error
		);
	}
	return defaultValue;
};

/**
 * Save data to localStorage with error handling
 * @param key  - The localStorage key to write to
 * @param data - The data to save
 */
export const saveToLocalStorage = < T >( key: string, data: T ): void => {
	try {
		localStorage.setItem( key, JSON.stringify( data ) );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Failed to save data to localStorage (key: ${ key }):`,
			error
		);
	}
};
