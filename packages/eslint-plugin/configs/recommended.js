/**
 * External dependencies
 */
const { cosmiconfigSync } = require( 'cosmiconfig' );

/**
 * WordPress dependencies
 */
const defaultPrettierConfig = require( '@wordpress/prettier-config' );

const { config: localPrettierConfig } =
	cosmiconfigSync( 'prettier' ).search() || {};
const prettierConfig = { ...defaultPrettierConfig, ...localPrettierConfig };

module.exports = {
	settings: {
		'import/resolver': {
			node: {
				extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
			},
		},
		'import/parser': {
			'@typescript-eslint/parser': [ '.ts', '.tsx' ],
		},
		'import/core-modules': [ 'react' ],
	},
	extends: [
		require.resolve( './recommended-with-formatting.js' ),
		'plugin:prettier/recommended',
		'prettier/react',
		'plugin:@typescript-eslint/eslint-recommended',
	],
	rules: {
		'prettier/prettier': [ 'error', prettierConfig ],
	},
	overrides: [
		{
			files: [ '**/*.ts', '**/*.tsx' ],
			rules: {
				// Don't require redundant JSDoc types in TypeScript files.
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-returns-type': 'off',
				// handled by TS itself
				'no-unused-vars': 'off',
			},
		},
	],
};
