/** @format */
const path = require( 'path' );
const blacklist = require( 'metro-config/src/defaults/blacklist' );
// Blacklist the nested GB filetree so modules are not resolved in duplicates,
//  both in the nested directory and the parent directory.
const blacklistElements = blacklist( [
	new RegExp( path.basename( __dirname ) + '/gutenberg/.*' ),
] );

const { lstatSync, readdirSync } = require( 'fs' );
const getDirectoryNames = ( dir ) =>
	readdirSync( dir ).filter( ( name ) => lstatSync( path.resolve( dir, name ) ).isDirectory() );

const wppackagenames = getDirectoryNames( path.resolve( __dirname, '../packages/' ) );

const mapper = function( accu, v ) {
	accu[ '@wordpress/' + v ] = path.resolve( __dirname, '../packages/' + v );
	return accu;
};

const wppackages = wppackagenames.reduce( mapper, {} );
const alternateRoots = [ path.resolve( __dirname, '../node_modules' ) ].concat(
	Object.values( wppackages )
);

module.exports = {
	watchFolders: alternateRoots,
	resolver: {
		extraNodeModules: wppackages,
		blacklistRE: blacklistElements,
		sourceExts: [ 'js', 'json', 'scss', 'sass' ],
		providesModuleNodeModules: [ 'react-native-svg', 'react-native' ],
	},
	transformer: {
		babelTransformerPath: require.resolve( './sass-transformer-inside-gb.js' ),
	},
};
