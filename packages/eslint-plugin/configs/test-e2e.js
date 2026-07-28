/**
 * External dependencies
 */
const globals = require( 'globals' );
const jestPlugin = require( 'eslint-plugin-jest' );

module.exports = [
	jestPlugin.configs[ 'flat/recommended' ],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				browser: 'readonly',
				page: 'readonly',
				wp: 'readonly',
			},
		},
	},
];
