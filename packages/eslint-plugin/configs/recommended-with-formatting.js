const config = {
	extends: [
		require.resolve( './jsx-a11y.js' ),
		require.resolve( './custom.js' ),
		require.resolve( './react.js' ),
		require.resolve( './esnext.js' ),
		require.resolve( './i18n.js' ),
	],
	plugins: [ 'import' ],
	env: {
		node: true,
	},
	globals: {
		window: true,
		document: true,
		SCRIPT_DEBUG: 'readonly',
		wp: 'readonly',
	},
	settings: {
		'import/extensions': [ '.js', '.jsx' ],
		'import/resolver': {
			typescript: true,
		},
	},
	rules: {
		'import/no-extraneous-dependencies': [
			'error',
			{
				peerDependencies: true,
			},
		],
		'import/no-unresolved': 'error',
		'import/default': 'warn',
		'import/named': 'warn',
	},
};

module.exports = config;
