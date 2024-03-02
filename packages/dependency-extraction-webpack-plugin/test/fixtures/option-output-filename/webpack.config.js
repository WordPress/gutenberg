/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			outputFilename: '[name]-foo.asset.php',
			requestToExternalModule( request ) {
				return (
					request.startsWith( '@wordpress/' ) || request === 'lodash'
				);
			},
		} ),
	],
};
