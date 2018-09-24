/** @format */
const path = require( 'path' );
const blacklist = require( 'metro-config/src/defaults/blacklist' );
const blacklistElements = blacklist( [ new RegExp( path.basename( __dirname ) + '/gutenberg/gutenberg-mobile/.*' ) ] );
const enm = require( './extra-node-modules.config.js' );

module.exports = {
	extraNodeModules: enm,
	resolver: {
		blacklistRE: blacklistElements,
		sourceExts: [ 'js', 'json', 'scss', 'sass' ],
	},
	transformer: {
		babelTransformerPath: require.resolve( './sass-transformer.js' ),
	},
};
