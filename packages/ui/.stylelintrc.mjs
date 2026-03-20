/** @type {import('stylelint').Config} */
export default {
	extends: '../../.stylelintrc.js',
	rules: {
		'declaration-property-value-disallowed-list': [
			{
				cursor: [ 'pointer' ],
			},
			{
				message: ( property, value ) => {
					if ( property === 'cursor' ) {
						return 'Use the `var( --wpds-cursor-control )` token for interactive non-link controls. If this is for a link, you can disable this rule.';
					}
				},
			},
		],
	},
};
