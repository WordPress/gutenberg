/** @format */
const blacklist = require( 'metro' ).createBlacklist;

module.exports = {
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
