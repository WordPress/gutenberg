/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			requestToExternalModule( request ) {
				if ( request.startsWith( '@wordpress/' ) ) {
					return request;
				}
			},
		} ),
	],
};
