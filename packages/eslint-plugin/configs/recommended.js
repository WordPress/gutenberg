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

let { config: localPrettierConfig } =
	cosmiconfigSync( 'prettier' ).search() || {};

// If the local config is a string, it's a file path, and we need to load it to
// get the config object.
if ( typeof localPrettierConfig === 'string' ) {
	localPrettierConfig = (
		cosmiconfigSync().load( localPrettierConfig ) || {}
	).config;
}

const prettierConfig = { ...defaultPrettierConfig, ...localPrettierConfig };

const config = {
	extends: [
		require.resolve( './recommended-with-formatting.js' ),
		'plugin:prettier/recommended',
		'prettier/react',
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
		'import/core-modules': [ 'react' ],
	};
	config.extends.push( 'plugin:@typescript-eslint/eslint-recommended' );
	config.ignorePatterns = [ '**/*.d.ts' ];
	config.overrides = [
		{
			files: [ '**/*.ts', '**/*.tsx' ],
			parser: '@typescript-eslint/parser',
			rules: {
				// Don't require redundant JSDoc types in TypeScript files.
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-returns-type': 'off',
				// handled by TS itself
				'no-unused-vars': 'off',
			},
		},
	];
}

module.exports = config;
