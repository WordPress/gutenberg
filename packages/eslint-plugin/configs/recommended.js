/**
 * External dependencies
 */
const { cosmiconfigSync } = require( 'cosmiconfig' );

/**
 * WordPress dependencies
 */
const defaultPrettierConfig = require( '@wordpress/prettier-config' );

/**
 * Internal dependencies
 */
const { isPackageInstalled } = require( '../utils' );

const { config: localPrettierConfig } =
	cosmiconfigSync( 'prettier' ).search() || {};
const prettierConfig = { ...defaultPrettierConfig, ...localPrettierConfig };

const config = {
	extends: [
		require.resolve( './recommended-with-formatting.js' ),
		'plugin:prettier/recommended',
	],
	rules: {
		'prettier/prettier': [ 'error', prettierConfig ],
	},
};

if ( isPackageInstalled( 'typescript' ) ) {
	config.settings = {
		'import/resolver': {
			node: {
				extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
			},
		},
	};
	config.extends.push( 'plugin:@typescript-eslint/eslint-recommended' );
	config.ignorePatterns = [ '**/*.d.ts' ];
	config.plugins = [ '@typescript-eslint' ];
	config.overrides = [
		{
			files: [ '**/*.ts', '**/*.tsx' ],
			parser: '@typescript-eslint/parser',
			rules: {
				'no-duplicate-imports': 'off',
				'@typescript-eslint/no-duplicate-imports': 'error',
				// Don't require redundant JSDoc types in TypeScript files.
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-returns-type': 'off',
				// handled by TS itself
				'no-unused-vars': 'off',
				// no-shadow doesn't work correctly in TS, so let's use a TS-dedicated version instead.
				'no-shadow': 'off',
				'@typescript-eslint/no-shadow': 'error',
			},
		},
	];
}

module.exports = config;
