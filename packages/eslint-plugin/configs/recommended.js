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
		window: 'readonly',
		document: 'readonly',
		wp: 'readonly',
	},
	overrides: [
		{
			files: [
				'**/@(test|__tests__)/**/*.js',
				'**/?(*.)test.js',
			],
			extends: [
				require.resolve( './test-unit.js' ),
			],
		},
		{
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
