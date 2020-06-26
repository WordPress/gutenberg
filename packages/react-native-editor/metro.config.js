/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	watchFolders: [ path.resolve( __dirname, '../..' ) ],
	resolver: {
		sourceExts: [ 'js', 'json', 'scss', 'sass', 'ts', 'tsx' ],
		platforms: [ 'native', 'android', 'ios' ],
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
