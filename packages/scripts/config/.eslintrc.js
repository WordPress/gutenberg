/**
 * Internal dependencies
 */
const defaultPrettierConfig = require( './.prettierrc' );
const { hasPrettierConfig } = require( '../utils' );

const eslintConfig = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',

		// Temporary workaround to use linting rules for both e2e and unit tests with all files
		// until override files globbing logic is fixed when using with --config.
		// @see https://github.com/eslint/eslint/issues/11558
		'plugin:@wordpress/eslint-plugin/test-e2e',
		'plugin:@wordpress/eslint-plugin/test-unit',
	],
};

if ( ! hasPrettierConfig() ) {
	eslintConfig.rules = {
		'prettier/prettier': [
			'error',
			defaultPrettierConfig,
			{
				usePrettierrc: false,
			},
		],
	};
}

module.exports = eslintConfig;
