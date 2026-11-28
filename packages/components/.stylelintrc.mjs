import baseConfig from '@wordpress/stylelint-tools/config';

const [ disallowedValues, disallowedValueMessages ] =
	baseConfig.rules[ 'declaration-property-value-disallowed-list' ];

/** @type {import('stylelint').Config} */
export default {
	extends: '@wordpress/stylelint-tools/config',
	rules: {
		// Allow this package's own private properties while keeping other private prefixes restricted.
		'custom-property-pattern': '^(?:_wp-components-.+|(?!_(?:gcd|wp)-).+)',
		'declaration-property-value-disallowed-list': [
			{
				...disallowedValues,
				'/.*/': [
					...disallowedValues[ '/.*/' ],
					'/--wp-admin-theme-/',
					'/--wp-components-color-/',
				],
			},
			{
				message: ( property, value ) => {
					if (
						/--wp-admin-theme-/.test( value ) ||
						/--wp-components-color-/.test( value )
					) {
						return 'To support component theming and ensure proper fallbacks, use Sass variables from packages/components/src/utils/theme-variables.scss instead.';
					}
					return disallowedValueMessages.message( property, value );
				},
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
