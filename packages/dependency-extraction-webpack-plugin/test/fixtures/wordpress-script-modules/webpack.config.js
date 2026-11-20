const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	entry: {
		static: './static.js',
		dynamic: './dynamic.js',
		'both-kinds': './both-kinds.js',
		'both-kinds-split': './both-kinds-split.js',
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
