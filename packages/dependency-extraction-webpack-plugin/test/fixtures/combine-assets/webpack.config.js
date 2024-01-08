/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	entry: {
		fileA: './file-a.js',
		fileB: './file-b.js',
	},
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			combineAssets: true,
			requestToExternalModule( request ) {
				if ( request.startsWith( '@wordpress/' ) ) {
					return request;
				}
			},
		} ),
	],
};
