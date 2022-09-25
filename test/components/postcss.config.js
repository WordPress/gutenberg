/**
 * WordPress dependencies
 */
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

module.exports = () => ( {
	plugins: postcssPlugins,
} );
