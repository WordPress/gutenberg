/**
 * External dependencies
 */
const babel = require( '@babel/core' );

module.exports = function( environment ) {
	process.env.WP_EDITOR_BUILD = environment;
	const { options } = babel.loadPartialConfig( {
		configFile: '@wordpress/babel-preset-default',
	} );
	delete process.env.WP_EDITOR_BUILD;
	return options;
};
