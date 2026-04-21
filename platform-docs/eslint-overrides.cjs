module.exports = [
	{
		files: [ 'platform-docs/**/*.js' ],
		settings: {
			react: {
				pragma: 'React',
				version: 'detect',
				flowVersion: '0.92.0',
			},
		},
		rules: {
			'import/no-unresolved': 'off',
		},
	},
];
