/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	entry: {
		a: './a',
		b: './b',
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
	optimization: {
		runtimeChunk: 'single',
	},
};
