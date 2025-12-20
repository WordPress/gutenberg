/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			// eslint-disable-next-line no-unused-vars
			requestToExternal( request ) {
				throw new Error( 'Ensure error in script build.' );
			},
		} ),
	],
};
