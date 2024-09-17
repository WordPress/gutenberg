/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			outputFormat: 'json',
			requestToExternalModule( request ) {
				return request === 'lodash';
			},
		} ),
	],
};
