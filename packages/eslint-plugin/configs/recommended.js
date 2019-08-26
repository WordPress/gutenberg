module.exports = {
	parser: 'babel-eslint',
	extends: [
		require.resolve( './jsx-a11y.js' ),
		require.resolve( './custom.js' ),
		require.resolve( './react.js' ),
		require.resolve( './esnext.js' ),
	],
	env: {
		node: true,
	},
	globals: {
		window: true,
		document: true,
		wp: 'readonly',
	},
	overrides: [
		{
			// Unit test files and their helpers only.
			files: [
				'**/@(test|__tests__)/**/*.js',
				'**/?(*.)test.js',
			],
			extends: [
				require.resolve( './test-unit.js' ),
			],
		},
		{
			// End-to-end test files and their helpers only.
			files: [
				'**/specs/**/*.js',
				'**/?(*.)spec.js',
			],
			extends: [
				require.resolve( './test-e2e.js' ),
			],
		},
	],
};
