const vitestPlugin = require( '@vitest/eslint-plugin' );

module.exports = [
	vitestPlugin.configs.recommended,
	{
		rules: {
			'vitest/expect-expect': [
				'error',
				{ assertFunctionNames: [ 'expect', 'measurePerformance' ] },
			],
		},
	},
];
