/**
 * Internal dependencies
 */
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );

module.exports = {
	mode: 'development',
	context: __dirname,
	entry: {
		boo: './boo',
		foo: './foo',
	},
	output: {
		filename: 'build/[name].js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'global',
	},
	plugins: [ new LibraryExportDefaultPlugin( [ 'boo' ] ) ],
};
