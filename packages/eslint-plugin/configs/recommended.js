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
	},
};
