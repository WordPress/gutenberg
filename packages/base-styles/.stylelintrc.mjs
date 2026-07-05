import baseConfig from '@wordpress/stylelint-tools/config';

const [ disallowedValues, disallowedValueMessages ] =
	baseConfig.rules[ 'declaration-property-value-disallowed-list' ];

/** @type {import('stylelint').Config} */
export default {
	extends: '@wordpress/stylelint-tools/config',
	rules: {
		'declaration-property-value-disallowed-list': [
			{
				...disallowedValues,
				'/.*/': [
					...disallowedValues[ '/.*/' ],
					'/var\\(\\s*--wpds-/',
				],
			},
			{
				message: ( property, value ) => {
					if ( /var\(\s*--wpds-/.test( value ) ) {
						return 'To ensure proper fallbacks, `@use "@wordpress/theme/utils" as wpds` and use `wpds.var()` instead of direct `var(--wpds-*)` references.';
					}
					return disallowedValueMessages.message( property, value );
				},
			},
		],
	},
};
