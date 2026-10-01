const vitest = require( '@vitest/eslint-plugin' );

module.exports = [
	vitest.configs.recommended,
	{
		rules: {
			'vitest/require-awaited-expect-poll': 'error',
			'vitest/valid-title': [ 'error', { allowArguments: true } ],
		},
	},
];
