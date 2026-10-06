const vitest = require( '@vitest/eslint-plugin' );

module.exports = [
	vitest.configs.recommended,
	{
		rules: {
			'vitest/valid-title': [ 'error', { allowArguments: true } ],
		},
	},
];
