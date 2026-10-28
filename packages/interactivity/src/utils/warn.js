const logged = new Set();

/**
 * Shows a warning with `message` if environment is not `production`.
 *
 * Based on the `@wordpress/warning` package.
 *
 * @param {string} message Message to show in the warning.
 */
export const warn = ( message ) => {
	if ( typeof SCRIPT_DEBUG !== 'undefined' && SCRIPT_DEBUG === true ) {
		if ( logged.has( message ) ) {
			return;
		}

		// eslint-disable-next-line no-console
		console.warn( message );

		// Throwing an error and catching it immediately to improve debugging
		// A consumer can use 'pause on caught exceptions'
		try {
			throw Error( message );
		} catch ( e ) {
			// Do nothing.
		}
		logged.add( message );
	}
};
