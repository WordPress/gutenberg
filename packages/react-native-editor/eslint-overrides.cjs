const globals = require( 'globals' );

module.exports = [
	// React Native editor settings and restricted syntax.
	{
		files: [ 'packages/react-native-editor/**/*.js' ],
		settings: {
			react: {
				pragma: 'React',
				version: 'detect',
				flowVersion: '0.92.0',
			},
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jest,
				__DEV__: true,
			},
		},
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector:
						'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] Literal[value=/\\.{3}/]',
					message:
						'Use ellipsis character (\u2026) in place of three dots',
				},
				{
					selector:
						'ImportDeclaration[source.value="lodash"] Identifier.imported[name="memoize"]',
					message: 'Use memize instead of Lodash\u2019s memoize',
				},
				{
					selector:
						'CallExpression[callee.object.name="page"][callee.property.name="waitFor"]',
					message: 'Prefer page.waitForSelector instead.',
				},
				{
					selector:
						'JSXAttribute[name.name="id"][value.type="Literal"]',
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
			'import/no-unresolved': 'off',
		},
	},

	// Device test globals and rules.
	{
		files: [ 'packages/react-native-editor/__device-tests__/**/*.js' ],
		languageOptions: {
			globals: {
				editorPage: true,
				e2eTestData: true,
				e2eUtils: true,
			},
		},
		rules: {
			'jest/expect-expect': 'off',
		},
	},
];
