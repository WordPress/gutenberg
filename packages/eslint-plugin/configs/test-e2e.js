/**
 * External dependencies
 */
const jest = require( 'eslint-plugin-jest' );
const globals = require( 'globals' );

module.exports = {
	...jest.configs[ 'flat/recommended' ],
	languageOptions: {
		globals: {
			...globals.browser,
			browser: 'readonly',
			page: 'readonly',
			wp: 'readonly',
		},
	},
};
