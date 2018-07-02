/** @format */
const blacklist = require( 'metro' ).createBlacklist;

const enm = require( 'node-libs-react-native' );
enm.fs = __dirname + '/__mocks__/nodejsMock.js';
enm.net = __dirname + '/__mocks__/nodejsMock.js';
enm.canvas = __dirname + '/__mocks__/nodejsMock.js';

module.exports = {
	extraNodeModules: enm,
	getBlacklistRE: function() {
		return blacklist( [ /gutenberg\/packages\/.*/ ] );
	},
	getTransformModulePath() {
		return require.resolve( './sass-transformer.js' );
	},
	getSourceExts() {
		return [ 'js', 'json', 'scss', 'sass' ];
	},
};
