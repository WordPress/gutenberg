/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			outputFilename: '[name]-foo.asset.php',
			requestToExternalModule( request ) {
				if ( request.startsWith( '@wordpress/' ) ) {
					return request;
				}
			},
		} ),
	],
};
