/** @format */
const blacklist = require( 'metro' ).createBlacklist;

const enm = require( 'node-libs-react-native' );
enm.fs = __dirname + '/__mocks__/nodejsMock.js';
enm.net = __dirname + '/__mocks__/nodejsMock.js';
enm.canvas = __dirname + '/__mocks__/nodejsMock.js';

module.exports = {
	extraNodeModules: enm,
	getBlacklistRE: function() {
		// blacklist the GB packages we want to consume from NPM (online) directly
		return blacklist( [ /gutenberg\/packages\/(autop|hooks|i18n|is-shallow-equal)\/.*/ ] );
	},
	getTransformModulePath() {
		return require.resolve( './sass-transformer.js' );
	},
	getSourceExts() {
		return [ 'js', 'json', 'scss', 'sass' ];
	},
};
