/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			outputFormat: 'json',
			requestToExternalModule( request ) {
				if ( request.startsWith( 'test-external' ) ) {
					return request;
				}
			},
		} ),
	],
};
