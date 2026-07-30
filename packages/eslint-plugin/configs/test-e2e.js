const globals = require( 'globals' );

module.exports = [
	{
		languageOptions: {
			globals: {
				...globals.browser,
				browser: 'readonly',
				page: 'readonly',
				wp: 'readonly',
			},
		},
	},
];
