module.exports = {
	plugins: [ '@wordpress' ],
	rules: {
		'@wordpress/no-unused-vars-before-return': 'error',
		'@wordpress/valid-sprintf': 'error',
		'@wordpress/no-base-control-with-label-without-id': 'error',
		'@wordpress/no-unguarded-get-range-at': 'error',
		'@wordpress/i18n-translator-comments': 'error',
		'@wordpress/i18n-text-domain': 'error',
		'@wordpress/i18n-no-collapsible-whitespace': 'error',
		'@wordpress/i18n-no-placeholders-only': 'error',
		'@wordpress/i18n-no-variables': 'error',
		'@wordpress/i18n-ellipsis': 'error',
		'no-restricted-syntax': [
			'error',
			{
				selector:
					'CallExpression[callee.name=/^(__|_n|_nx|_x)$/]:not([arguments.0.type=/^Literal|BinaryExpression$/])',
				message:
					'Translate function arguments must be string literals.',
			},
			{
				selector:
					'CallExpression[callee.name=/^(_n|_nx|_x)$/]:not([arguments.1.type=/^Literal|BinaryExpression$/])',
				message:
					'Translate function arguments must be string literals.',
			},
			{
				selector:
					'CallExpression[callee.name=_nx]:not([arguments.3.type=/^Literal|BinaryExpression$/])',
				message:
					'Translate function arguments must be string literals.',
			},
		],
	},
	overrides: [
		{
			files: [ '*.native.js' ],
			rules: {
				'@wordpress/no-base-control-with-label-without-id': 'off',
			},
		},
	],
	settings: {
		react: {
			version: '16.6',
		},
	},
};
