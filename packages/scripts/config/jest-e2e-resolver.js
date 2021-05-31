/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * A custom resolver to fallback wordpress dependencies to their sources.
 * It's useful when running dev build but still want to run some e2e tests.
 *
 * @param {string} request The requested path to resolve.
 * @param {Object} options The options.
 *
 * @return {string} The resolved path.
 */
function resolver( request, options ) {
	if ( request.startsWith( '@wordpress/' ) ) {
		const packageName = request.slice( '@wordpress/'.length );

		try {
			return options.defaultResolver( request, options );
		} catch {
			// Call the defaultResolver, so we leverage its cache, error handling, etc.
			return options.defaultResolver(
				path.resolve(
					process.cwd(),
					`packages/${ packageName }/src/index.js`
				),
				options
			);
		}
	}

	// Fallback to the default resolver.
	return options.defaultResolver( request, options );
}

module.exports = resolver;
