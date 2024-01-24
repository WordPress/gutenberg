/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
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
