/**
 * Resolve the shared config from its workspace by path rather than by package name.
 * npm-package-json-lint resolves a bare `extends` name relative to each linted `package.json`,
 * which only reaches the config when it is hoisted to the root `node_modules`; a path resolved from this file works regardless of the install layout.
 */
module.exports = {
	extends: require.resolve( './packages/npm-package-json-lint-config' ),
	rules: {
		'description-format': [
			'error',
			{
				requireCapitalFirstLetter: true,
				requireEndingPeriod: true,
			},
		],
		'require-publishConfig': 'error',
		'require-repository-directory': 'error',
		'valid-values-author': [ 'error', [ 'The WordPress Contributors' ] ],
		'valid-values-publishConfig': [
			'error',
			[
				{
					access: 'public',
				},
			],
		],
	},
	overrides: [
		{
			patterns: [ './package.json' ],
			rules: {
				'require-publishConfig': 'off',
				'require-repository-directory': 'off',
			},
		},
	],
};
