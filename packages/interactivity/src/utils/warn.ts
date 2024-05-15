const logged = new Set();

export const warn = ( message ) => {
	// @ts-expect-error
	if ( typeof SCRIPT_DEBUG !== 'undefined' && SCRIPT_DEBUG === true ) {
		if ( logged.has( message ) ) {
			return;
		}

		// eslint-disable-next-line no-console
		console.warn( message );

		// Adding a stack trace to the warning message to help with debugging.
		try {
			throw Error( message );
		} catch ( e ) {
			// Do nothing.
		}
		logged.add( message );
	}
};
