/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	entry: {
		a: './a',
		b: './b',
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
	optimization: {
		runtimeChunk: 'single',
	},
};
