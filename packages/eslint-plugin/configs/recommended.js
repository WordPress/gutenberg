/**
 * WordPress dependencies
 */
const defaultPrettierConfig = require( '@wordpress/prettier-config' );

module.exports = {
	extends: [
		require.resolve( './recommended-with-formatting.js' ),
		'plugin:prettier/recommended',
		'prettier/react',
	],
	rules: {
		'prettier/prettier': [ 'error', defaultPrettierConfig ],
	},
};
