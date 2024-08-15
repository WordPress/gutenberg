/** @type {import('stylelint').Config} */
module.exports = {
	extends: '../../.stylelintrc.json',
	rules: {
		'declaration-property-value-disallowed-list': [
			{
				'/.*/': [ '/--wp-admin-theme-/', '/--wp-components-color-/' ],
			},
			{
				message:
					'To support component theming and ensure proper fallbacks, use Sass variables from packages/components/src/utils/theme-variables.scss instead.',
			},
		],
	},
	overrides: [
		{
			files: [ './src/utils/theme-variables.scss' ],
			rules: {
				'declaration-property-value-disallowed-list': null,
			},
		},
	],
};
