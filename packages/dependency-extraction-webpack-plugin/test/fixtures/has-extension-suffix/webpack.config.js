/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	output: {
		filename: 'index.min.js',
	},
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
