const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	entry: {
		static: './static.js',
		dynamic: './dynamic.js',
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
