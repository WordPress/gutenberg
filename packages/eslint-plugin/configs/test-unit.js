/**
 * External dependencies
 */
const jest = require( 'eslint-plugin-jest' );

module.exports = [
	jest.configs[ 'flat/recommended' ],
	{
		rules: {
			'jest/expect-expect': [
				'error',
				{ assertFunctionNames: [ 'expect', 'measurePerformance' ] },
			],
		},
	},
];
