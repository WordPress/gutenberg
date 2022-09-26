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
		} ),
	],
};
