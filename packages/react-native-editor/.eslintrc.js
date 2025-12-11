module.exports = {
	env: {
		browser: true,
		'jest/globals': true,
	},
	globals: {
		__DEV__: true,
	},
	plugins: [ 'react', 'jest' ],
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	settings: {
		react: {
			pragma: 'React',
			version: 'detect',
			flowVersion: '0.92.0',
		},
		'import/resolver': require.resolve(
			'../../tools/eslint/import-resolver'
		),
	},
	rules: {
		'no-restricted-syntax': [
			'error',
			{
				selector:
					'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] Literal[value=/\\.{3}/]',
				message: 'Use ellipsis character (…) in place of three dots',
			},
			{
				selector:
					'ImportDeclaration[source.value="lodash"] Identifier.imported[name="memoize"]',
				message: 'Use memize instead of Lodash’s memoize',
			},
			{
				selector:
					'CallExpression[callee.object.name="page"][callee.property.name="waitFor"]',
				message: 'Prefer page.waitForSelector instead.',
			},
			{
				selector: 'JSXAttribute[name.name="id"][value.type="Literal"]',
				message:
					'Do not use string literals for IDs; use useId hook instead.',
			},
			{
				selector:
					'CallExpression[callee.name="withDispatch"] > :function > BlockStatement > :not(VariableDeclaration,ReturnStatement)',
				message:
					'withDispatch must return an object with consistent keys. Avoid performing logic in `mapDispatchToProps`.',
			},
		],
	},
	overrides: [
		{
			files: [ '**/*.js' ],
			rules: {
				'import/no-unresolved': 'off',
			},
		},
	],
};
