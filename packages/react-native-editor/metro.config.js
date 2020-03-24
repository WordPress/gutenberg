/** @format */
const path = require( 'path' );
const enm = require( './extra-node-modules.config.js' );

module.exports = {
	watchFolders: [
		path.resolve( __dirname, '../..' )
	],
	resolver: {
		sourceExts: [ 'js', 'json', 'scss', 'sass', 'ts', 'tsx' ],
		extraNodeModules: enm,
	},
	transformer: {
		babelTransformerPath: require.resolve( './sass-transformer.js' ),
		getTransformOptions: async () => ( {
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false,
			},
		} ),
	},
};
