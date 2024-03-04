module.exports = {
	root: true,
	plugins: [ 'react' ],
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	settings: {
		react: {
			pragma: 'React',
			version: 'detect',
			flowVersion: '0.92.0',
		},
		'import/resolver': require.resolve( '../tools/eslint/import-resolver' ),
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
