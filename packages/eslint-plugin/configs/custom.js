module.exports = {
	plugins: [
		'@wordpress',
	],
	rules: {
		'@wordpress/dependency-group': 'error',
		'@wordpress/gutenberg-phase': 'error',
		'@wordpress/no-unused-vars-before-return': 'error',
		'@wordpress/valid-sprintf': 'error',
		'no-restricted-syntax': [
			'error',
			{
				selector: 'CallExpression[callee.name=/^__|_n|_x$/]:not([arguments.0.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
			{
				selector: 'CallExpression[callee.name=/^_n|_x$/]:not([arguments.1.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
			{
				selector: 'CallExpression[callee.name=_nx]:not([arguments.2.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
		],
	},
	settings: {
		react: {
			version: '16.6',
		},
	},
};
