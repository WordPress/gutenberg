module.exports = {
	env: {
		es6: true,
	},
	extends: [ require.resolve( './es5.js' ) ],
	parserOptions: {
		sourceType: 'module',
	},
	rules: {
		// Disable ES5-specific (extended from ES5)
		'vars-on-top': 'off',

		// Enable ESNext-specific
		'arrow-parens': [ 'error', 'always' ],
		'arrow-spacing': 'error',
		'computed-property-spacing': [ 'error', 'always' ],
		'constructor-super': 'error',
		'no-const-assign': 'error',
		'no-dupe-class-members': 'error',
		'no-duplicate-imports': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'no-var': 'error',
		'object-shorthand': 'error',
		'prefer-const': 'error',
		quotes: [
			'error',
			'single',
			{ allowTemplateLiterals: true, avoidEscape: true },
		],
		'space-unary-ops': [
			'error',
			{
				overrides: {
					'!': true,
					yield: true,
				},
			},
		],
		'template-curly-spacing': [ 'error', 'always' ],
	},
};
