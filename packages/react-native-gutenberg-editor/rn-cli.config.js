/** @format */
const path = require( 'path' );
const blacklist = require( 'metro-config/src/defaults/blacklist' );
// Blacklist the nested GB filetree so modules are not resolved in duplicates,
//  both in the nested directory and the parent directory.
const blacklistElements = blacklist( [
	///node_modules\/.*\/node_modules\/react-native\/.*/,
] );
const enm = require( './extra-node-modules.config.js' );
const watchFolders = [
	path.resolve( __dirname, '../..' ),
	path.resolve( __dirname, '.' ),
	//path.resolve( __dirname, './src' ),
];

module.exports = {
	extraNodeModules: enm,
	resolver: {
		blacklistRE: blacklistElements,
		sourceExts: [ 'js', 'json', 'scss', 'sass' ],
	},
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false
			}
		}),
		babelTransformerPath: require.resolve( './sass-transformer.js' ),
	},
	watchFolders,
};
