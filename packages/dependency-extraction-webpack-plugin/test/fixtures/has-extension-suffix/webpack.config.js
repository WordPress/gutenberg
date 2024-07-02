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
				return (
					request.startsWith( '@wordpress/' ) || request === 'lodash'
				);
			},
		} ),
	],
};
