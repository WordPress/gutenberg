const noBuildStyleImports = require( './eslint/no-build-style-imports' );

module.exports = [
	// Flag side-effect imports of package `build-style` stylesheets so Storybook can load them through `package-styles/config.js`.
	{
		files: [
			'**/@(storybook|stories)/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
		],
		plugins: {
			'gutenberg-storybook': {
				rules: {
					'no-build-style-imports': noBuildStyleImports,
				},
			},
		},
		rules: {
			'gutenberg-storybook/no-build-style-imports': 'error',
		},
	},
];
