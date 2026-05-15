/**
 * External dependencies
 */
const jestPlugin = require( 'eslint-plugin-jest' );

module.exports = [
	jestPlugin.configs[ 'flat/recommended' ],
	{
		rules: {
			'jest/expect-expect': [
				'error',
				{ assertFunctionNames: [ 'expect', 'measurePerformance' ] },
			],
		},
	},
];
