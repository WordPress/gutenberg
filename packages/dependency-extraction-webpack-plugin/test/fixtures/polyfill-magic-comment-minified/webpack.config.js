/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	optimization: {
		minimize: true,
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
