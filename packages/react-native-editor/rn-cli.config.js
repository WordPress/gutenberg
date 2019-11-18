/** @format */
const path = require( 'path' );
// Blacklist the nested GB filetree so modules are not resolved in duplicates,
//  both in the nested directory and the parent directory.

const enm = require( './extra-node-modules.config.js' );

module.exports = {
	resolver: {
		extraNodeModules: enm,
		sourceExts: [ 'js', 'json', 'scss', 'sass' ],
	},
	transformer: {
		babelTransformerPath: require.resolve( './sass-transformer.js' ),
	},
	watchFolders: [
		path.resolve( __dirname, '../' ),
		path.resolve( __dirname, '../../node_modules' ),
	],
};
