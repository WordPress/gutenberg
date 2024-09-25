/**
 * External dependencies
 */
const jsxA11y = require( 'eslint-plugin-jsx-a11y' );

module.exports = [
	jsxA11y.flatConfigs.recommended,
	{
		rules: {
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
