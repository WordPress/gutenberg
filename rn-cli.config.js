/** @format */

module.exports = {
	getTransformModulePath() {
		return require.resolve( './sass-transformer.js' );
	},
	getSourceExts() {
		return [ 'scss', 'sass' ];
	},
};
