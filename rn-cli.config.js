/** @format */
const blacklist = require( 'metro' ).createBlacklist;

const enm = require( 'node-libs-react-native' );
enm.fs = __dirname + '/__mocks__/nodejsMock.js';
enm.net = __dirname + '/__mocks__/nodejsMock.js';
enm.canvas = __dirname + '/__mocks__/nodejsMock.js';

module.exports = {
	extraNodeModules: enm,
	getBlacklistRE: function() {
		// Blacklist the GB packages we want to consume from NPM (online) directly.
		// On the other hand, GB packages that are loaded from the source tree directly
		// are automagically resolved by Metro so, there is no list of them anywhere.
		return blacklist( [
			/gutenberg\/packages\/(autop|compose|deprecated|hooks|i18n|is-shallow-equal|redux-routine)\/.*/,
		] );
	},
	getTransformModulePath() {
		return require.resolve( './sass-transformer.js' );
	},
	getSourceExts() {
		return [ 'js', 'json', 'scss', 'sass' ];
	},
};
