/**
 * External dependencies
 */
const jsxA11yPlugin = require( 'eslint-plugin-jsx-a11y' );

module.exports = [
	jsxA11yPlugin.flatConfigs.recommended,
	{
		rules: {
			// False positives with `render` props (e.g. `<Text render={ <h1 /> }>…</Text>`).
			// See https://github.com/WordPress/gutenberg/issues/76501
			'jsx-a11y/heading-has-content': 'off',
			'jsx-a11y/label-has-associated-control': [
				'error',
				{
					assert: 'htmlFor',
				},
			],
			'jsx-a11y/media-has-caption': 'off',
			'jsx-a11y/no-noninteractive-tabindex': 'off',
			'jsx-a11y/role-has-required-aria-props': 'off',
			'jsx-quotes': 'error',
		},
	},
];
